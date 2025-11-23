// Linux pixel sampler with support for X11 and Wayland (via XWayland)
// 
// This implementation uses native X11 APIs for pixel sampling and cursor tracking.
// On Wayland systems, the Electron app is launched with --ozone-platform=x11 which
// forces it to use XWayland compatibility layer. This allows the X11 implementation
// to work transparently on both X11 and Wayland systems.
//
// Note: Native Wayland support would require compositor-specific portal APIs and
// would not provide the real-time pixel sampling needed for the magnifier feature.

use crate::types::{Color, PixelSampler, Point};
use std::env;
use std::ptr;
use std::sync::atomic::{AtomicBool, Ordering};

static X_ERROR_OCCURRED: AtomicBool = AtomicBool::new(false);

// Custom X error handler that doesn't exit the process
unsafe extern "C" fn x_error_handler(
    _display: *mut x11::xlib::Display,
    error_event: *mut x11::xlib::XErrorEvent,
) -> i32 {
    X_ERROR_OCCURRED.store(true, Ordering::SeqCst);
    
    let error = &*error_event;
    eprintln!(
        "X11 Error: type={}, serial={}, error_code={}, request_code={}, minor_code={}",
        error.type_,
        error.serial,
        error.error_code,
        error.request_code,
        error.minor_code
    );
    
    0 // Return 0 to indicate we handled it
}

pub struct LinuxSampler {
    x11_display: *mut x11::xlib::Display,
    screen_width: i32,
    screen_height: i32,
    cached_region: Option<CachedRegion>,
}

struct CachedRegion {
    image: *mut x11::xlib::XImage,
    x: i32,
    y: i32,
    width: u32,
    height: u32,
}

impl LinuxSampler {
    pub fn new() -> Result<Self, String> {
        // Try to open X11 display
        // This works on native X11 and also on Wayland when using XWayland
        // (The app is launched with --ozone-platform=x11 which forces XWayland)
        unsafe {
            let display = x11::xlib::XOpenDisplay(ptr::null());
            if display.is_null() {
                return Err("Failed to open X11 display. Make sure X11 or XWayland is available.".to_string());
            }
            
            // Install custom error handler to prevent crashes on X errors
            x11::xlib::XSetErrorHandler(Some(x_error_handler));
            
            // Get screen dimensions
            let screen = x11::xlib::XDefaultScreen(display);
            let screen_width = x11::xlib::XDisplayWidth(display, screen);
            let screen_height = x11::xlib::XDisplayHeight(display, screen);
            
            // Check if we're running via XWayland on Wayland
            let session_type = env::var("XDG_SESSION_TYPE").unwrap_or_default();
            if session_type == "wayland" {
                eprintln!("Linux sampler initialized (XWayland on Wayland) - Screen: {}x{}", screen_width, screen_height);
            } else {
                eprintln!("Linux sampler initialized (X11) - Screen: {}x{}", screen_width, screen_height);
            }
            
            Ok(LinuxSampler {
                x11_display: display,
                screen_width,
                screen_height,
                cached_region: None,
            })
        }
    }
    
    fn capture_region(&mut self, center_x: i32, center_y: i32, size: u32) -> Result<(), String> {
        // Clear old cached region
        if let Some(ref cache) = self.cached_region {
            unsafe {
                x11::xlib::XDestroyImage(cache.image);
            }
        }
        
        // Calculate region to capture (centered on cursor)
        let half_size = (size / 2) as i32;
        let x = (center_x - half_size).max(0);
        let y = (center_y - half_size).max(0);
        let width = size.min((self.screen_width - x) as u32);
        let height = size.min((self.screen_height - y) as u32);
        
        unsafe {
            let root = x11::xlib::XDefaultRootWindow(self.x11_display);
            
            // Clear any previous errors
            X_ERROR_OCCURRED.store(false, Ordering::SeqCst);
            
            let image = x11::xlib::XGetImage(
                self.x11_display,
                root,
                x,
                y,
                width,
                height,
                x11::xlib::XAllPlanes(),
                x11::xlib::ZPixmap,
            );
            
            // Sync to process any pending errors
            x11::xlib::XSync(self.x11_display, 0);
            
            if X_ERROR_OCCURRED.load(Ordering::SeqCst) || image.is_null() {
                return Err(format!("Failed to capture region at ({}, {}) {}x{}", x, y, width, height));
            }
            
            self.cached_region = Some(CachedRegion {
                image,
                x,
                y,
                width,
                height,
            });
            
            Ok(())
        }
    }

    fn sample_from_cache(&self, x: i32, y: i32) -> Result<Color, String> {
        let cache = self.cached_region.as_ref()
            .ok_or_else(|| "No cached region available".to_string())?;
        
        // Check if the coordinates are within the cached region
        if x < cache.x || y < cache.y || 
           x >= cache.x + cache.width as i32 || 
           y >= cache.y + cache.height as i32 {
            return Err("Coordinates outside cached region".to_string());
        }
        
        unsafe {
            // Calculate local coordinates within the cached image
            let local_x = x - cache.x;
            let local_y = y - cache.y;
            
            let pixel = x11::xlib::XGetPixel(cache.image, local_x, local_y);
            
            // Extract RGB components from pixel value
            let r = ((pixel >> 16) & 0xFF) as u8;
            let g = ((pixel >> 8) & 0xFF) as u8;
            let b = (pixel & 0xFF) as u8;
            
            Ok(Color::new(r, g, b))
        }
    }
    
    fn get_x11_cursor_position(&self) -> Result<Point, String> {
        unsafe {
            let root = x11::xlib::XDefaultRootWindow(self.x11_display);
            
            let mut root_return = 0;
            let mut child_return = 0;
            let mut root_x = 0;
            let mut root_y = 0;
            let mut win_x = 0;
            let mut win_y = 0;
            let mut mask_return = 0;
            
            let result = x11::xlib::XQueryPointer(
                self.x11_display,
                root,
                &mut root_return,
                &mut child_return,
                &mut root_x,
                &mut root_y,
                &mut win_x,
                &mut win_y,
                &mut mask_return,
            );
            
            if result == 0 {
                return Err("Failed to query X11 pointer".to_string());
            }
            
            Ok(Point { x: root_x, y: root_y })
        }
    }
}

impl Drop for LinuxSampler {
    fn drop(&mut self) {
        if let Some(ref cache) = self.cached_region {
            unsafe {
                x11::xlib::XDestroyImage(cache.image);
            }
        }
        unsafe {
            x11::xlib::XCloseDisplay(self.x11_display);
        }
    }
}

impl PixelSampler for LinuxSampler {
    fn sample_pixel(&mut self, x: i32, y: i32) -> Result<Color, String> {
        self.sample_from_cache(x, y)
    }

    fn get_cursor_position(&self) -> Result<Point, String> {
        self.get_x11_cursor_position()
    }
    
    fn sample_grid(&mut self, center_x: i32, center_y: i32, grid_size: usize, _scale_factor: f64) -> Result<Vec<Vec<crate::types::Color>>, String> {
        // Capture a region large enough for the grid
        // Add some padding to account for grid size
        let capture_size = (grid_size * 2 + 20) as u32;
        
        if let Err(e) = self.capture_region(center_x, center_y, capture_size) {
            eprintln!("Failed to capture region: {}", e);
            // Return gray grid on error
            let gray = crate::types::Color::new(128, 128, 128);
            return Ok(vec![vec![gray; grid_size]; grid_size]);
        }
        
        // Now sample from the cached region
        let half_size = (grid_size / 2) as i32;
        let mut grid = Vec::with_capacity(grid_size);
        
        for row in 0..grid_size {
            let mut row_pixels = Vec::with_capacity(grid_size);
            for col in 0..grid_size {
                let x = center_x + (col as i32 - half_size);
                let y = center_y + (row as i32 - half_size);
                
                let color = self.sample_from_cache(x, y)
                    .unwrap_or(crate::types::Color::new(128, 128, 128));
                row_pixels.push(color);
            }
            grid.push(row_pixels);
        }
        
        Ok(grid)
    }
}

// Linux pixel sampler with support for X11 and Wayland
// 
// Strategy:
// 1. Try X11 XGetImage (fast, works on native X11)
// 2. If that fails (Wayland/XWayland), fall back to screenshot tools:
//    - grim (Wayland)
//    - scrot (X11 fallback)
//    - imagemagick import (X11 fallback)

use crate::types::{Color, PixelSampler, Point};
use std::process::Command;
use std::ptr;
use std::sync::atomic::{AtomicBool, Ordering};

static X_ERROR_OCCURRED: AtomicBool = AtomicBool::new(false);

// Custom X error handler that doesn't exit the process
unsafe extern "C" fn x_error_handler(
    _display: *mut x11::xlib::Display,
    _error_event: *mut x11::xlib::XErrorEvent,
) -> i32 {
    X_ERROR_OCCURRED.store(true, Ordering::SeqCst);
    0 // Return 0 to indicate we handled it
}

pub struct LinuxSampler {
    x11_display: *mut x11::xlib::Display,
    screen_width: i32,
    screen_height: i32,
    method: CaptureMethod,
    screenshot_cache: Option<ScreenshotCache>,
}

enum CaptureMethod {
    X11Direct,
    Grim,
    Scrot,
    ImageMagick,
}

struct ScreenshotCache {
    data: Vec<u8>,
    width: u32,
    height: u32,
    timestamp: std::time::Instant,
}

impl LinuxSampler {
    pub fn new() -> Result<Self, String> {
        unsafe {
            let display = x11::xlib::XOpenDisplay(ptr::null());
            if display.is_null() {
                return Err("Failed to open X11 display".to_string());
            }
            
            // Install custom error handler
            x11::xlib::XSetErrorHandler(Some(x_error_handler));
            
            // Get screen dimensions
            let screen = x11::xlib::XDefaultScreen(display);
            let screen_width = x11::xlib::XDisplayWidth(display, screen);
            let screen_height = x11::xlib::XDisplayHeight(display, screen);
            
            // Try to determine the best capture method
            let method = Self::detect_capture_method(display);
            
            eprintln!("Linux sampler initialized - Screen: {}x{}, Method: {:?}", 
                screen_width, screen_height, method);
            
            Ok(LinuxSampler {
                x11_display: display,
                screen_width,
                screen_height,
                method,
                screenshot_cache: None,
            })
        }
    }
    
    fn detect_capture_method(display: *mut x11::xlib::Display) -> CaptureMethod {
        // Try X11 direct capture first
        unsafe {
            X_ERROR_OCCURRED.store(false, Ordering::SeqCst);
            
            let root = x11::xlib::XDefaultRootWindow(display);
            let test_image = x11::xlib::XGetImage(
                display,
                root,
                0, 0, 1, 1,
                x11::xlib::XAllPlanes(),
                x11::xlib::ZPixmap,
            );
            
            x11::xlib::XSync(display, 0);
            
            if !X_ERROR_OCCURRED.load(Ordering::SeqCst) && !test_image.is_null() {
                x11::xlib::XDestroyImage(test_image);
                eprintln!("X11 direct capture available");
                return CaptureMethod::X11Direct;
            }
            
            if !test_image.is_null() {
                x11::xlib::XDestroyImage(test_image);
            }
        }
        
        // X11 failed, try screenshot tools
        eprintln!("X11 direct capture failed, trying screenshot tools...");
        
        // Check for grim (Wayland)
        if Command::new("which").arg("grim").output().map(|o| o.status.success()).unwrap_or(false) {
            eprintln!("Using grim for screen capture");
            return CaptureMethod::Grim;
        }
        
        // Check for scrot
        if Command::new("which").arg("scrot").output().map(|o| o.status.success()).unwrap_or(false) {
            eprintln!("Using scrot for screen capture");
            return CaptureMethod::Scrot;
        }
        
        // Check for ImageMagick import
        if Command::new("which").arg("import").output().map(|o| o.status.success()).unwrap_or(false) {
            eprintln!("Using ImageMagick import for screen capture");
            return CaptureMethod::ImageMagick;
        }
        
        eprintln!("WARNING: No screenshot tool found! Install grim, scrot, or imagemagick");
        CaptureMethod::X11Direct // Will fail but at least we tried
    }
    
    fn capture_screenshot(&mut self) -> Result<(), String> {
        match self.method {
            CaptureMethod::X11Direct => self.capture_x11_region(0, 0, self.screen_width as u32, self.screen_height as u32),
            CaptureMethod::Grim => self.capture_with_grim(),
            CaptureMethod::Scrot => self.capture_with_scrot(),
            CaptureMethod::ImageMagick => self.capture_with_imagemagick(),
        }
    }
    
    fn capture_x11_region(&mut self, x: i32, y: i32, width: u32, height: u32) -> Result<(), String> {
        unsafe {
            let root = x11::xlib::XDefaultRootWindow(self.x11_display);
            
            X_ERROR_OCCURRED.store(false, Ordering::SeqCst);
            
            let image = x11::xlib::XGetImage(
                self.x11_display,
                root,
                x, y, width, height,
                x11::xlib::XAllPlanes(),
                x11::xlib::ZPixmap,
            );
            
            x11::xlib::XSync(self.x11_display, 0);
            
            if X_ERROR_OCCURRED.load(Ordering::SeqCst) || image.is_null() {
                return Err("X11 capture failed".to_string());
            }
            
            // Convert XImage to RGB buffer
            let mut data = Vec::with_capacity((width * height * 3) as usize);
            
            for row in 0..height {
                for col in 0..width {
                    let pixel = x11::xlib::XGetPixel(image, col as i32, row as i32);
                    let r = ((pixel >> 16) & 0xFF) as u8;
                    let g = ((pixel >> 8) & 0xFF) as u8;
                    let b = (pixel & 0xFF) as u8;
                    data.push(r);
                    data.push(g);
                    data.push(b);
                }
            }
            
            x11::xlib::XDestroyImage(image);
            
            self.screenshot_cache = Some(ScreenshotCache {
                data,
                width,
                height,
                timestamp: std::time::Instant::now(),
            });
            
            Ok(())
        }
    }
    
    fn capture_with_grim(&mut self) -> Result<(), String> {
        let output = Command::new("grim")
            .arg("-t").arg("ppm")
            .arg("-")
            .output()
            .map_err(|e| format!("Failed to run grim: {}", e))?;
        
        if !output.status.success() {
            return Err(format!("grim failed: {}", String::from_utf8_lossy(&output.stderr)));
        }
        
        self.parse_ppm_screenshot(&output.stdout)
    }
    
    fn capture_with_scrot(&mut self) -> Result<(), String> {
        use std::fs;
        use std::io::Read;
        
        let temp_file = "/tmp/swach_screenshot.ppm";
        
        let status = Command::new("scrot")
            .arg("-o")
            .arg(temp_file)
            .status()
            .map_err(|e| format!("Failed to run scrot: {}", e))?;
        
        if !status.success() {
            return Err("scrot failed".to_string());
        }
        
        let mut file = fs::File::open(temp_file)
            .map_err(|e| format!("Failed to open screenshot: {}", e))?;
        
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer)
            .map_err(|e| format!("Failed to read screenshot: {}", e))?;
        
        let _ = fs::remove_file(temp_file);
        
        self.parse_ppm_screenshot(&buffer)
    }
    
    fn capture_with_imagemagick(&mut self) -> Result<(), String> {
        let output = Command::new("import")
            .arg("-window").arg("root")
            .arg("-depth").arg("8")
            .arg("ppm:-")
            .output()
            .map_err(|e| format!("Failed to run import: {}", e))?;
        
        if !output.status.success() {
            return Err("import failed".to_string());
        }
        
        self.parse_ppm_screenshot(&output.stdout)
    }
    
    fn parse_ppm_screenshot(&mut self, data: &[u8]) -> Result<(), String> {
        // Find the start of pixel data by parsing header manually
        let mut pos = 0;
        
        // Read magic number (P6)
        let magic_end = data.iter().position(|&b| b == b'\n').ok_or("No newline after magic")?;
        if &data[0..magic_end] != b"P6" {
            return Err(format!("Invalid PPM magic: {:?}", String::from_utf8_lossy(&data[0..magic_end])));
        }
        pos = magic_end + 1;
        
        // Skip comments and find dimensions
        let mut width = 0u32;
        let mut height = 0u32;
        while pos < data.len() {
            let line_end = data[pos..].iter().position(|&b| b == b'\n').ok_or("Unexpected EOF")? + pos;
            let line = &data[pos..line_end];
            
            if line.starts_with(b"#") {
                pos = line_end + 1;
                continue;
            }
            
            // Parse dimensions
            let dims_str = String::from_utf8_lossy(line);
            let dims: Vec<&str> = dims_str.trim().split_whitespace().collect();
            if dims.len() == 2 {
                width = dims[0].parse().map_err(|e| format!("Invalid width: {}", e))?;
                height = dims[1].parse().map_err(|e| format!("Invalid height: {}", e))?;
                pos = line_end + 1;
                break;
            }
            
            return Err("Could not parse dimensions".to_string());
        }
        
        // Read max value
        let line_end = data[pos..].iter().position(|&b| b == b'\n').ok_or("No newline after max value")? + pos;
        let max_val_str = String::from_utf8_lossy(&data[pos..line_end]);
        let max_val: u32 = max_val_str.trim().parse()
            .map_err(|e| format!("Invalid max value: {}", e))?;
        
        if max_val != 255 {
            return Err(format!("Unsupported max value: {}", max_val));
        }
        
        pos = line_end + 1;
        
        // Rest is pixel data
        let pixel_data = &data[pos..];
        
        self.screenshot_cache = Some(ScreenshotCache {
            data: pixel_data.to_vec(),
            width,
            height,
            timestamp: std::time::Instant::now(),
        });
        
        Ok(())
    }
    
    fn ensure_fresh_screenshot(&mut self) -> Result<(), String> {
        let needs_refresh = match &self.screenshot_cache {
            None => true,
            Some(cache) => cache.timestamp.elapsed().as_millis() > 50, // 50ms cache for 20 FPS
        };
        
        if needs_refresh {
            self.capture_screenshot()?;
        }
        
        Ok(())
    }
}

impl Drop for LinuxSampler {
    fn drop(&mut self) {
        unsafe {
            x11::xlib::XCloseDisplay(self.x11_display);
        }
    }
}

impl std::fmt::Debug for CaptureMethod {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CaptureMethod::X11Direct => write!(f, "X11Direct"),
            CaptureMethod::Grim => write!(f, "Grim"),
            CaptureMethod::Scrot => write!(f, "Scrot"),
            CaptureMethod::ImageMagick => write!(f, "ImageMagick"),
        }
    }
}

impl PixelSampler for LinuxSampler {
    fn sample_pixel(&mut self, x: i32, y: i32) -> Result<Color, String> {
        self.ensure_fresh_screenshot()?;
        
        let cache = self.screenshot_cache.as_ref()
            .ok_or("No screenshot cached")?;
        
        if x < 0 || y < 0 || x >= cache.width as i32 || y >= cache.height as i32 {
            return Ok(Color::new(128, 128, 128));
        }
        
        let index = ((y as u32 * cache.width + x as u32) * 3) as usize;
        
        if index + 2 >= cache.data.len() {
            return Ok(Color::new(128, 128, 128));
        }
        
        let r = cache.data[index];
        let g = cache.data[index + 1];
        let b = cache.data[index + 2];
        
        Ok(Color::new(r, g, b))
    }

    fn get_cursor_position(&self) -> Result<Point, String> {
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
                return Err("Failed to query pointer".to_string());
            }
            
            Ok(Point { x: root_x, y: root_y })
        }
    }
    
    fn sample_grid(&mut self, center_x: i32, center_y: i32, grid_size: usize, _scale_factor: f64) -> Result<Vec<Vec<Color>>, String> {
        // Ensure we have a fresh screenshot
        self.ensure_fresh_screenshot()?;
        
        let half_size = (grid_size / 2) as i32;
        let mut grid = Vec::with_capacity(grid_size);
        
        for row in 0..grid_size {
            let mut row_pixels = Vec::with_capacity(grid_size);
            for col in 0..grid_size {
                let x = center_x + (col as i32 - half_size);
                let y = center_y + (row as i32 - half_size);
                
                let color = self.sample_pixel(x, y)
                    .unwrap_or(Color::new(128, 128, 128));
                row_pixels.push(color);
            }
            grid.push(row_pixels);
        }
        
        Ok(grid)
    }
}

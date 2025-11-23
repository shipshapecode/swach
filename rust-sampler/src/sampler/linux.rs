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

pub struct LinuxSampler {
    x11_display: *mut x11::xlib::Display,
    screen_width: i32,
    screen_height: i32,
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
            })
        }
    }

    fn sample_x11_pixel(&self, x: i32, y: i32) -> Result<Color, String> {
        // Clamp coordinates to screen bounds to avoid BadMatch errors
        let clamped_x = x.max(0).min(self.screen_width - 1);
        let clamped_y = y.max(0).min(self.screen_height - 1);
        
        unsafe {
            let root = x11::xlib::XDefaultRootWindow(self.x11_display);
            
            // Sync to ensure we're getting current screen state
            x11::xlib::XSync(self.x11_display, 0);
            
            let image = x11::xlib::XGetImage(
                self.x11_display,
                root,
                clamped_x,
                clamped_y,
                1,
                1,
                x11::xlib::XAllPlanes(),
                x11::xlib::ZPixmap,
            );
            
            if image.is_null() {
                return Err(format!("Failed to get X11 image at ({}, {})", clamped_x, clamped_y));
            }
            
            let pixel = x11::xlib::XGetPixel(image, 0, 0);
            x11::xlib::XDestroyImage(image);
            
            // Extract RGB components from pixel value
            // X11 typically uses 0x00RRGGBB format for 24-bit displays
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
        unsafe {
            x11::xlib::XCloseDisplay(self.x11_display);
        }
    }
}

impl PixelSampler for LinuxSampler {
    fn sample_pixel(&mut self, x: i32, y: i32) -> Result<Color, String> {
        self.sample_x11_pixel(x, y)
    }

    fn get_cursor_position(&self) -> Result<Point, String> {
        self.get_x11_cursor_position()
    }
}

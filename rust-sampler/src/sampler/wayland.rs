// Wayland screen capture using XDG Desktop Portal Screenshot API
//
// This uses the org.freedesktop.portal.Screenshot interface which:
// 1. Requests one-time permission (can be saved)
// 2. Returns screenshots that we cache
// 3. Works on all Portal-compliant compositors (GNOME, KDE, wlroots)

use crate::types::{Color, PixelSampler, Point};
use ashpd::desktop::screenshot::{Screenshot, ScreenshotOptions};
use ashpd::WindowIdentifier;
use image::GenericImageView;
use std::path::PathBuf;

pub struct WaylandSampler {
    runtime: tokio::runtime::Runtime,
    x11_display: *mut x11::xlib::Display,
    screenshot_cache: Option<ScreenshotCache>,
}

struct ScreenshotCache {
    data: Vec<u8>,
    width: u32,
    height: u32,
    timestamp: std::time::Instant,
}

impl WaylandSampler {
    pub fn new() -> Result<Self, String> {
        eprintln!("Initializing Wayland sampler via XDG Desktop Portal...");
        
        // We still need X11 display for cursor position
        let x11_display = unsafe {
            let display = x11::xlib::XOpenDisplay(std::ptr::null());
            if display.is_null() {
                return Err("Failed to open X11 display for cursor tracking".to_string());
            }
            display
        };
        
        // Create tokio runtime for async Portal operations
        let runtime = tokio::runtime::Runtime::new()
            .map_err(|e| format!("Failed to create tokio runtime: {}", e))?;
        
        eprintln!("Wayland sampler initialized - will use Desktop Portal for screenshots");
        
        Ok(WaylandSampler {
            runtime,
            x11_display,
            screenshot_cache: None,
        })
    }
    
    fn capture_screenshot(&mut self) -> Result<(), String> {
        self.runtime.block_on(async {
            let screenshot = Screenshot::new().await
                .map_err(|e| format!("Failed to connect to screenshot portal: {}", e))?;
            
            // Request screenshot with modal option (shows permission dialog if needed)
            let screenshot_path: PathBuf = screenshot
                .screenshot(
                    &WindowIdentifier::default(),
                    ScreenshotOptions::default()
                        .modal(false) // Don't block other windows
                        .interactive(false), // Don't let user select area
                )
                .await
                .map_err(|e| format!("Screenshot request failed: {}", e))?
                .into();
            
            // Load the screenshot image
            let img = image::open(&screenshot_path)
                .map_err(|e| format!("Failed to load screenshot: {}", e))?;
            
            // Clean up the temporary file
            let _ = std::fs::remove_file(screenshot_path);
            
            // Convert to RGB buffer
            let rgb_img = img.to_rgb8();
            let (width, height) = rgb_img.dimensions();
            
            self.screenshot_cache = Some(ScreenshotCache {
                data: rgb_img.into_raw(),
                width,
                height,
                timestamp: std::time::Instant::now(),
            });
            
            Ok(())
        })
    }
    
    fn ensure_fresh_screenshot(&mut self) -> Result<(), String> {
        let needs_refresh = match &self.screenshot_cache {
            None => true,
            Some(cache) => cache.timestamp.elapsed().as_millis() > 100, // 100ms = 10 FPS
        };
        
        if needs_refresh {
            self.capture_screenshot()?;
        }
        
        Ok(())
    }
}

impl Drop for WaylandSampler {
    fn drop(&mut self) {
        unsafe {
            x11::xlib::XCloseDisplay(self.x11_display);
        }
    }
}

impl PixelSampler for WaylandSampler {
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
}

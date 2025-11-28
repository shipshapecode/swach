use crate::types::{Color, PixelSampler, Point};
use core_graphics::display::{CGDisplay, CGPoint};
use core_graphics::geometry::{CGRect, CGSize};
use core_graphics::image::CGImage;

pub struct MacOSSampler {
    _display: CGDisplay,
    _scale_factor: f64,
}

// Native macOS APIs for window-aware screen capture
#[link(name = "CoreGraphics", kind = "framework")]
extern "C" {
    fn CGWindowListCreateImage(
        rect: CGRect,
        list_option: u32,
        window_id: u32,
        image_option: u32,
    ) -> *mut std::ffi::c_void;
}

// CGWindowListOption constants
const K_CG_WINDOW_LIST_OPTION_ON_SCREEN_ONLY: u32 = 1 << 0;

// CGWindowImageOption constants  
const K_CG_WINDOW_IMAGE_BEST_RESOLUTION: u32 = 1 << 0;

impl MacOSSampler {
    pub fn new() -> Result<Self, String> {
        let display = CGDisplay::main();
        
        // Get display scale factor for Retina support
        // On Retina displays, this will be 2.0; on standard displays, 1.0
        let bounds = display.bounds();
        let mode = display.display_mode();
        let scale_factor = if let Some(mode) = mode {
            (mode.width() as f64) / bounds.size.width
        } else {
            1.0 // Fallback to 1.0 if we can't determine
        };
        
        Ok(MacOSSampler {
            _display: display,
            _scale_factor: scale_factor,
        })
    }
    
    // Capture screen region using CGWindowListCreateImage
    // Windows with content protection enabled will be excluded automatically
    fn capture_window_list_image(&self, rect: CGRect) -> Option<CGImage> {
        unsafe {
            // Use ON_SCREEN_ONLY to capture all visible windows
            // Windows with setContentProtection(true) will be automatically excluded
            let image_ref = CGWindowListCreateImage(
                rect,
                K_CG_WINDOW_LIST_OPTION_ON_SCREEN_ONLY,
                0, // kCGNullWindowID - include all windows (except protected ones)
                K_CG_WINDOW_IMAGE_BEST_RESOLUTION,
            );
            
            if image_ref.is_null() {
                None
            } else {
                // Create CGImage from raw sys pointer
                let image: CGImage = std::mem::transmute(image_ref);
                Some(image)
            }
        }
    }
}

impl PixelSampler for MacOSSampler {
    fn sample_pixel(&mut self, x: i32, y: i32) -> Result<Color, String> {
        // Capture a 1x1 pixel at the specified coordinates using window list
        let rect = CGRect::new(
            &CGPoint::new(x as f64, y as f64),
            &CGSize::new(1.0, 1.0),
        );
        
        let image = self.capture_window_list_image(rect)
            .ok_or_else(|| "Failed to capture screen pixel".to_string())?;

        let data = image.data();
        
        // Need at least 4 bytes for BGRA format
        if data.len() < 4 {
            return Err("Insufficient image data".to_string());
        }

        // CGImage format is typically BGRA
        let b = data[0];
        let g = data[1];
        let r = data[2];

        Ok(Color::new(r, g, b))
    }

    fn get_cursor_position(&self) -> Result<Point, String> {
        // Use Core Graphics to get current mouse position
        unsafe {
            // Call CGEventCreate which creates an event at the current cursor position
            #[link(name = "CoreGraphics", kind = "framework")]
            extern "C" {
                fn CGEventCreate(source: *mut std::ffi::c_void) -> *mut std::ffi::c_void;
                fn CGEventGetLocation(event: *mut std::ffi::c_void) -> CGPoint;
                fn CFRelease(cf: *const std::ffi::c_void);
            }
            
            let event_ref = CGEventCreate(std::ptr::null_mut());
            if event_ref.is_null() {
                return Err("Failed to create CG event".to_string());
            }
            
            let point = CGEventGetLocation(event_ref);
            CFRelease(event_ref as *const std::ffi::c_void);
            
            Ok(Point {
                x: point.x as i32,
                y: point.y as i32,
            })
        }
    }

    // Optimized grid sampling - capture once and sample from buffer
    fn sample_grid(&mut self, center_x: i32, center_y: i32, grid_size: usize, _scale_factor: f64) -> Result<Vec<Vec<Color>>, String> {
        let half_size = (grid_size / 2) as i32;
        
        // Calculate the region to capture
        let x_start = center_x - half_size;
        let y_start = center_y - half_size;
        let width = grid_size as i32;
        let height = grid_size as i32;
        
        // Capture the entire region in one screenshot using window list
        let rect = CGRect::new(
            &CGPoint::new(x_start as f64, y_start as f64),
            &CGSize::new(width as f64, height as f64),
        );
        
        let image = self.capture_window_list_image(rect)
            .ok_or_else(|| "Failed to capture screen region".to_string())?;

        let data = image.data();
        let bytes_per_row = image.bytes_per_row();
        let image_width = image.width() as usize;
        let image_height = image.height() as usize;
        let bits_per_pixel = image.bits_per_pixel();
        let bytes_per_pixel = (bits_per_pixel / 8) as usize;
        
        // Calculate scale factor - image might be 2x larger on Retina displays
        let scale_x = image_width / grid_size;
        let scale_y = image_height / grid_size;
        
        // Sample pixels from the captured image accounting for scale
        let mut grid = Vec::with_capacity(grid_size);
        
        for row in 0..grid_size {
            let mut row_pixels = Vec::with_capacity(grid_size);
            for col in 0..grid_size {
                // Account for Retina scaling - sample at scaled positions
                let pixel_row = row * scale_y;
                let pixel_col = col * scale_x;
                
                // Calculate offset in the image data
                let offset = (pixel_row * bytes_per_row) + (pixel_col * bytes_per_pixel);
                
                if offset + bytes_per_pixel <= data.len() as usize {
                    // CGImage format is typically BGRA
                    let b = data[offset];
                    let g = data[offset + 1];
                    let r = data[offset + 2];
                    
                    row_pixels.push(Color::new(r, g, b));
                } else {
                    row_pixels.push(Color::new(128, 128, 128));
                }
            }
            grid.push(row_pixels);
        }
        
        Ok(grid)
    }
}

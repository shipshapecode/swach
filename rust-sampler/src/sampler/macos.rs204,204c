use crate::types::{Color, PixelSampler, Point};
use core_graphics::display::{CGDisplay, CGPoint};

pub struct MacOSSampler {
    display: CGDisplay,
    scale_factor: f64,
}

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
        
        eprintln!("[MacOSSampler] Scale factor: {}", scale_factor);
        
        Ok(MacOSSampler {
            display,
            scale_factor,
        })
    }

    #[allow(dead_code)]
        // Use Core Graphics to get the current mouse position
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
}

impl MacOSSampler {
    fn sample_pixel_from_rect(&mut self, x: i32, y: i32, w: i32, h: i32) -> Result<Color, String> {
        // Create a small image at the specified coordinates
        let image = self.display
            .image_for_rect(core_graphics::geometry::CGRect::new(
                &CGPoint::new(x as f64, y as f64),
                &core_graphics::geometry::CGSize::new(w as f64, h as f64),
            ))
            .ok_or_else(|| "Failed to capture screen region".to_string())?;

        let data = image.data();
        let bits_per_pixel = image.bits_per_pixel();
        let bytes_per_pixel = (bits_per_pixel / 8) as isize;
        
        if (data.len() as isize) < bytes_per_pixel {
            return Err("Insufficient image data".to_string());
        }

        // CGImage format is typically BGRA
        let b = data[0];
        let g = data[1];
        let r = data[2];

        Ok(Color::new(r, g, b))
    }

    #[allow(dead_code)]
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
}

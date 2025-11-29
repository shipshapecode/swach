use crate::types::{Color, PixelSampler, Point};
use windows::Win32::Foundation::{COLORREF, POINT};
use windows::Win32::Graphics::Gdi::{GetDC, GetPixel, ReleaseDC, HDC, CLR_INVALID};
use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;

pub struct WindowsSampler {
    hdc: HDC,
}

impl WindowsSampler {
    pub fn new() -> Result<Self, String> {
        unsafe {
            let hdc = GetDC(None);
            
            if hdc.is_invalid() {
                return Err("Failed to get device context".to_string());
            }
            
            eprintln!("Windows sampler initialized");
            
            Ok(WindowsSampler { hdc })
        }
    }
}

impl Drop for WindowsSampler {
    fn drop(&mut self) {
        unsafe {
            let _ = ReleaseDC(None, self.hdc);
        }
    }
}

impl PixelSampler for WindowsSampler {
    fn sample_pixel(&mut self, x: i32, y: i32) -> Result<Color, String> {
        unsafe {
            let color_ref = GetPixel(self.hdc, x, y);
            
            // Check for error (CLR_INVALID is returned on error)
            // In windows 0.58, COLORREF is a type alias to u32, not a newtype
            if color_ref == CLR_INVALID {
                return Err(format!("Failed to get pixel at ({}, {})", x, y));
            }
            
            // COLORREF is a u32 in BGR format: 0x00BBGGRR
            let r = (color_ref & 0xFF) as u8;
            let g = ((color_ref >> 8) & 0xFF) as u8;
            let b = ((color_ref >> 16) & 0xFF) as u8;
            
            Ok(Color::new(r, g, b))
        }
    }

    fn get_cursor_position(&self) -> Result<Point, String> {
        unsafe {
            let mut point = POINT { x: 0, y: 0 };
            
            GetCursorPos(&mut point)
                .map_err(|e| format!("Failed to get cursor position: {}", e))?;
            
            Ok(Point {
                x: point.x,
                y: point.y,
            })
        }
    }
}

use crate::types::{Color, PixelSampler, Point};
use windows::Win32::Foundation::POINT;
use windows::Win32::Graphics::Gdi::{
    GetDC, GetPixel, ReleaseDC, COLORREF,
};
use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;

pub struct WindowsSampler {
    hdc: windows::Win32::Graphics::Gdi::HDC,
}

impl WindowsSampler {
    pub fn new() -> Result<Self, String> {
        unsafe {
            let hdc = GetDC(None);
            
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
    fn set_exclude_window_id(&mut self, _window_id: u32) {
        // Not implemented for Windows
    }
    
    fn sample_pixel(&mut self, x: i32, y: i32) -> Result<Color, String> {
        unsafe {
            let color_ref = GetPixel(self.hdc, x, y);
            
            // COLORREF format is 0x00BBGGRR
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

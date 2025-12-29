use crate::types::{Color, PixelSampler, Point};
use std::mem;
use windows::Win32::Foundation::POINT;
use windows::Win32::Graphics::Gdi::{
    BitBlt, CreateCompatibleBitmap, CreateCompatibleDC, DeleteDC, DeleteObject, GetDC,
    GetDeviceCaps, GetDIBits, GetPixel, LOGPIXELSX, ReleaseDC, SelectObject, BITMAPINFO, 
    BITMAPINFOHEADER, BI_RGB, CLR_INVALID, DIB_RGB_COLORS, HDC, SRCCOPY,
};
use windows::Win32::UI::WindowsAndMessaging::{GetCursorPos, GetSystemMetrics, SM_CXVIRTUALSCREEN, SM_CYVIRTUALSCREEN};

pub struct WindowsSampler {
    hdc: HDC,
    screen_width: i32,
    screen_height: i32,
    dpi_scale: f64,
}

impl WindowsSampler {
    pub fn new() -> Result<Self, String> {
        unsafe {
            let hdc = GetDC(None);
            
            if hdc.is_invalid() {
                return Err("Failed to get device context".to_string());
            }
            
            // Get virtual screen dimensions (supports multi-monitor)
            let screen_width = GetSystemMetrics(SM_CXVIRTUALSCREEN);
            let screen_height = GetSystemMetrics(SM_CYVIRTUALSCREEN);
            
            // Get DPI scaling factor
            // GetDeviceCaps returns DPI (e.g., 96 for 100%, 192 for 200%)
            // Standard DPI is 96, so scale = actual_dpi / 96
            let dpi = GetDeviceCaps(hdc, LOGPIXELSX);
            let dpi_scale = dpi as f64 / 96.0;
            
            eprintln!("Windows sampler initialized ({}x{}, DPI scale: {})", 
                screen_width, screen_height, dpi_scale);
            
            Ok(WindowsSampler { 
                hdc,
                screen_width,
                screen_height,
                dpi_scale,
            })
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
            // Convert from physical pixels to logical pixels
            let logical_x = (x as f64 / self.dpi_scale) as i32;
            let logical_y = (y as f64 / self.dpi_scale) as i32;
            
            let color_ref = GetPixel(self.hdc, logical_x, logical_y);
            
            // Check for error (CLR_INVALID is returned on error)
            // COLORREF is a newtype wrapper around u32
            if color_ref.0 == CLR_INVALID {
                return Err(format!("Failed to get pixel at ({}, {})", x, y));
            }
            
            // Extract the u32 value from COLORREF newtype
            let color_value = color_ref.0;
            
            // COLORREF format is 0x00BBGGRR (BGR, not RGB)
            let r = (color_value & 0xFF) as u8;
            let g = ((color_value >> 8) & 0xFF) as u8;
            let b = ((color_value >> 16) & 0xFF) as u8;
            
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

    // Optimized grid sampling using BitBlt for batch capture
    // This is ~100x faster than calling GetPixel 81 times (for 9x9 grid)
    fn sample_grid(&mut self, center_x: i32, center_y: i32, grid_size: usize, _scale_factor: f64) -> Result<Vec<Vec<Color>>, String> {
        unsafe {
            let half_size = (grid_size / 2) as i32;
            
            // Convert cursor coordinates from physical pixels to logical pixels
            // GetCursorPos returns physical pixels, but DC uses logical pixels
            // At 200% DPI: physical 2000 -> logical 1000
            let logical_x = (center_x as f64 / self.dpi_scale) as i32;
            let logical_y = (center_y as f64 / self.dpi_scale) as i32;
            
            // Calculate capture region in logical pixels
            let x_start = logical_x - half_size;
            let y_start = logical_y - half_size;
            let width = grid_size as i32;
            let height = grid_size as i32;
            
            // Create memory DC compatible with screen DC
            let mem_dc = CreateCompatibleDC(self.hdc);
            if mem_dc.is_invalid() {
                return Err("Failed to create compatible DC".to_string());
            }
            
            // Create compatible bitmap
            let bitmap = CreateCompatibleBitmap(self.hdc, width, height);
            if bitmap.is_invalid() {
                let _ = DeleteDC(mem_dc);
                return Err("Failed to create compatible bitmap".to_string());
            }
            
            // Select bitmap into memory DC
            let old_bitmap = SelectObject(mem_dc, bitmap);
            
            // Copy screen region to memory bitmap using BitBlt
            // This is the key optimization - ONE API call instead of grid_size^2 calls
            if let Err(_) = BitBlt(
                mem_dc,
                0,
                0,
                width,
                height,
                self.hdc,
                x_start,
                y_start,
                SRCCOPY,
            ) {
                // BitBlt failed - clean up and fall back to default implementation
                SelectObject(mem_dc, old_bitmap);
                let _ = DeleteObject(bitmap);
                let _ = DeleteDC(mem_dc);
                
                eprintln!("BitBlt failed, falling back to pixel-by-pixel sampling");
                return self.sample_grid_fallback(center_x, center_y, grid_size);
            }
            
            // Prepare bitmap info for GetDIBits
            let mut bmi = BITMAPINFO {
                bmiHeader: BITMAPINFOHEADER {
                    biSize: mem::size_of::<BITMAPINFOHEADER>() as u32,
                    biWidth: width,
                    biHeight: -height, // Negative for top-down DIB
                    biPlanes: 1,
                    biBitCount: 32, // 32-bit BGRA
                    biCompression: BI_RGB.0 as u32,
                    biSizeImage: 0,
                    biXPelsPerMeter: 0,
                    biYPelsPerMeter: 0,
                    biClrUsed: 0,
                    biClrImportant: 0,
                },
                bmiColors: [Default::default(); 1],
            };
            
            // Allocate buffer for pixel data (4 bytes per pixel: BGRA)
            let buffer_size = (width * height * 4) as usize;
            let mut buffer: Vec<u8> = vec![0; buffer_size];
            
            // Get bitmap bits
            let scan_lines = GetDIBits(
                mem_dc,
                bitmap,
                0,
                height as u32,
                Some(buffer.as_mut_ptr() as *mut _),
                &mut bmi,
                DIB_RGB_COLORS,
            );
            
            // Clean up GDI resources
            SelectObject(mem_dc, old_bitmap);
            let _ = DeleteObject(bitmap);
            let _ = DeleteDC(mem_dc);
            
            if scan_lines == 0 {
                eprintln!("GetDIBits failed, falling back to pixel-by-pixel sampling");
                return self.sample_grid_fallback(center_x, center_y, grid_size);
            }
            
            // Parse buffer and build grid
            let mut grid = Vec::with_capacity(grid_size);
            
            for row in 0..grid_size {
                let mut row_pixels = Vec::with_capacity(grid_size);
                for col in 0..grid_size {
                    // Calculate offset in buffer (BGRA format, 4 bytes per pixel)
                    let offset = ((row * grid_size + col) * 4) as usize;
                    
                    if offset + 3 < buffer.len() {
                        // Windows DIB format is BGRA
                        let b = buffer[offset];
                        let g = buffer[offset + 1];
                        let r = buffer[offset + 2];
                        // Alpha channel at offset + 3 is ignored
                        
                        row_pixels.push(Color::new(r, g, b));
                    } else {
                        // Fallback for out-of-bounds
                        row_pixels.push(Color::new(128, 128, 128));
                    }
                }
                grid.push(row_pixels);
            }
            
            Ok(grid)
        }
    }
}

impl WindowsSampler {
    // Fallback to default pixel-by-pixel sampling if BitBlt fails
    fn sample_grid_fallback(&mut self, center_x: i32, center_y: i32, grid_size: usize) -> Result<Vec<Vec<Color>>, String> {
        let half_size = (grid_size / 2) as i32;
        let mut grid = Vec::with_capacity(grid_size);
        
        for row in 0..grid_size {
            let mut row_pixels = Vec::with_capacity(grid_size);
            for col in 0..grid_size {
                let x = center_x + (col as i32 - half_size);
                let y = center_y + (row as i32 - half_size);
                
                let color = self.sample_pixel(x, y)
                    .unwrap_or(Color::new(128, 128, 128)); // Gray fallback
                row_pixels.push(color);
            }
            grid.push(row_pixels);
        }
        
        Ok(grid)
    }
}

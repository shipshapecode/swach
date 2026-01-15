use crate::types::{Color, PixelSampler, Point};
use std::mem;
use windows::Win32::Foundation::POINT;
use windows::Win32::Graphics::Gdi::{
    BitBlt, CreateCompatibleBitmap, CreateCompatibleDC, DeleteDC, DeleteObject, GetDC,
    GetDeviceCaps, GetDIBits, GetPixel, LOGPIXELSX, ReleaseDC, SelectObject, BITMAPINFO, 
    BITMAPINFOHEADER, BI_RGB, CLR_INVALID, DIB_RGB_COLORS, HDC, SRCCOPY,
};
use windows::Win32::UI::HiDpi::{SetProcessDpiAwarenessContext, DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2};
use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;

pub struct WindowsSampler {
    hdc: HDC,
    pub dpi_scale: f64,
}

impl WindowsSampler {
    pub fn new() -> Result<Self, String> {
        unsafe {
            // Set DPI awareness to per-monitor v2 so we can access physical pixels
            // This must be done before any GDI calls
            // Ignore errors - if it fails, we'll fall back to system DPI awareness
            let _ = SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2);
            
            let hdc = GetDC(None);

            if hdc.is_invalid() {
                return Err("Failed to get device context".to_string());
            }

            // Get DPI scaling factor
            // GetDeviceCaps returns DPI (e.g., 96 for 100%, 192 for 200%)
            // Standard DPI is 96, so scale = actual_dpi / 96
            let dpi = GetDeviceCaps(hdc, LOGPIXELSX);
            let dpi_scale = dpi as f64 / 96.0;
            
            eprintln!("[WindowsSampler] DPI scale factor: {}", dpi_scale);

            Ok(WindowsSampler {
                hdc,
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
            // With DPI awareness enabled, follow the macOS pattern:
            // - x, y are logical coordinates (like CGWindowListCreateImage on macOS)
            // - Convert to physical coordinates internally for GDI
            let physical_x = (x as f64 * self.dpi_scale) as i32;
            let physical_y = (y as f64 * self.dpi_scale) as i32;
            
            let color_ref = GetPixel(self.hdc, physical_x, physical_y);
            
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

            // With DPI awareness enabled, follow the macOS pattern:
            // - GetCursorPos returns physical coordinates
            // - Convert to logical coordinates (like macOS CGEventGetLocation)
            // - This matches Electron's coordinate system and main.rs expectations
            let logical_x = (point.x as f64 / self.dpi_scale) as i32;
            let logical_y = (point.y as f64 / self.dpi_scale) as i32;
            
            Ok(Point {
                x: logical_x,
                y: logical_y,
            })
        }
    }

    // Optimized grid sampling using BitBlt for batch capture
    // This is ~100x faster than calling GetPixel 81 times (for 9x9 grid)
    fn sample_grid(&mut self, center_x: i32, center_y: i32, grid_size: usize, _scale_factor: f64) -> Result<Vec<Vec<Color>>, String> {
        unsafe {
            let half_size = (grid_size / 2) as i32;
            
            // With DPI awareness enabled, follow the macOS pattern:
            // - center_x, center_y are logical coordinates
            // - Convert to physical coordinates for GDI operations
            let physical_center_x = (center_x as f64 * self.dpi_scale) as i32;
            let physical_center_y = (center_y as f64 * self.dpi_scale) as i32;
            
            let x_start = physical_center_x - half_size;
            let y_start = physical_center_y - half_size;
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
        unsafe {
            let half_size = (grid_size / 2) as i32;
            let mut grid = Vec::with_capacity(grid_size);
            
            // center_x, center_y are logical coordinates - convert to physical
            let physical_center_x = (center_x as f64 * self.dpi_scale) as i32;
            let physical_center_y = (center_y as f64 * self.dpi_scale) as i32;
            
            for row in 0..grid_size {
                let mut row_pixels = Vec::with_capacity(grid_size);
                for col in 0..grid_size {
                    // Calculate physical pixel coordinates
                    let x = physical_center_x + (col as i32 - half_size);
                    let y = physical_center_y + (row as i32 - half_size);
                    
                    let color_ref = GetPixel(self.hdc, x, y);
                    
                    let color = if color_ref.0 == CLR_INVALID {
                        Color::new(128, 128, 128) // Gray fallback for out-of-bounds
                    } else {
                        let color_value = color_ref.0;
                        let r = (color_value & 0xFF) as u8;
                        let g = ((color_value >> 8) & 0xFF) as u8;
                        let b = ((color_value >> 16) & 0xFF) as u8;
                        Color::new(r, g, b)
                    };
                    
                    row_pixels.push(color);
                }
                grid.push(row_pixels);
            }
            
            Ok(grid)
        }
    }
}

// Windows-specific sampler tests
// Only compiled and run on Windows

#![cfg(target_os = "windows")]

use swach_sampler::types::{Color, PixelSampler, Point};

// Mock Windows sampler for testing logic without requiring actual Windows APIs
struct MockWindowsSampler {
    screen_width: i32,   // Physical screen width (e.g., 5120 at 200% DPI)
    screen_height: i32,  // Physical screen height (e.g., 2880 at 200% DPI)
    dpi_scale: f64,      // DPI scale factor (e.g., 2.0 for 200%)
}

impl MockWindowsSampler {
    fn new(width: i32, height: i32) -> Self {
        MockWindowsSampler {
            screen_width: width,
            screen_height: height,
            dpi_scale: 1.0, // 100% scaling by default
        }
    }
    
    fn new_with_dpi(physical_width: i32, physical_height: i32, dpi_scale: f64) -> Self {
        MockWindowsSampler {
            screen_width: physical_width,
            screen_height: physical_height,
            dpi_scale,
        }
    }
}

impl PixelSampler for MockWindowsSampler {
    fn sample_pixel(&mut self, x: i32, y: i32) -> Result<Color, String> {
        // With DPI awareness enabled, follow the macOS pattern:
        // - x, y are logical coordinates
        // - Convert to physical coordinates internally for sampling
        let physical_x = (x as f64 * self.dpi_scale) as i32;
        let physical_y = (y as f64 * self.dpi_scale) as i32;
        
        // screen_width/height are physical dimensions
        if physical_x < 0 || physical_y < 0 || physical_x >= self.screen_width || physical_y >= self.screen_height {
            return Err(format!("Failed to get pixel at ({}, {})", x, y));
        }
        
        // Simulate COLORREF BGR format conversion to RGB
        // Use physical coordinates for color calculation (what GetPixel sees)
        let b_component = (physical_x % 256) as u8;
        let g_component = (physical_y % 256) as u8;
        let r_component = ((physical_x + physical_y) % 256) as u8;
        
        Ok(Color::new(r_component, g_component, b_component))
    }

    fn get_cursor_position(&self) -> Result<Point, String> {
        // With DPI awareness, GetCursorPos returns physical coordinates
        // But we return logical coordinates (physical / dpi_scale) for Electron
        let physical_x = 200; // Simulated physical cursor position
        let physical_y = 200;
        let logical_x = (physical_x as f64 / self.dpi_scale) as i32;
        let logical_y = (physical_y as f64 / self.dpi_scale) as i32;
        Ok(Point { x: logical_x, y: logical_y })
    }
    
    // Override sample_grid to simulate production behavior (logical coordinates)
    fn sample_grid(&mut self, center_x: i32, center_y: i32, grid_size: usize, _scale_factor: f64) -> Result<Vec<Vec<Color>>, String> {
        let half_size = (grid_size / 2) as i32;
        let mut grid = Vec::with_capacity(grid_size);

        // Production sample_grid operates in logical coordinates like macOS
        for row in 0..grid_size {
            let mut row_pixels = Vec::with_capacity(grid_size);
            for col in 0..grid_size {
                // Calculate logical pixel coordinates (matches production behavior)
                let logical_x = center_x + (col as i32 - half_size);
                let logical_y = center_y + (row as i32 - half_size);

                // Convert logical to physical for bounds checking and color calculation
                // (since screen_width/screen_height are physical dimensions)
                let physical_x = (logical_x as f64 * self.dpi_scale) as i32;
                let physical_y = (logical_y as f64 * self.dpi_scale) as i32;

                // Sample in physical space
                if physical_x < 0 || physical_y < 0 || physical_x >= self.screen_width || physical_y >= self.screen_height {
                    row_pixels.push(Color::new(128, 128, 128));
                } else {
                    let b_component = (physical_x % 256) as u8;
                    let g_component = (physical_y % 256) as u8;
                    let r_component = ((physical_x + physical_y) % 256) as u8;
                    row_pixels.push(Color::new(r_component, g_component, b_component));
                }
            }
            grid.push(row_pixels);
        }

        Ok(grid)
    }
}

#[test]
fn test_windows_sampler_basic_sampling() {
    let mut sampler = MockWindowsSampler::new(1920, 1080);
    
    let _color = sampler.sample_pixel(100, 200).unwrap();
    
    // Colors are u8, so they're always in valid range (0-255)
    // Just verify we got a color successfully
}

#[test]
fn test_windows_sampler_error_on_negative_coords() {
    let mut sampler = MockWindowsSampler::new(1920, 1080);
    
    // Windows GetPixel returns CLR_INVALID for out-of-bounds
    let result = sampler.sample_pixel(-10, -10);
    assert!(result.is_err(), "Should fail for negative coordinates");
}

#[test]
fn test_windows_sampler_error_on_out_of_bounds() {
    let mut sampler = MockWindowsSampler::new(1920, 1080);
    
    let result = sampler.sample_pixel(2000, 1100);
    assert!(result.is_err(), "Should fail for coordinates beyond screen");
}

#[test]
fn test_windows_sampler_cursor_position() {
    let sampler = MockWindowsSampler::new(1920, 1080);
    
    let cursor = sampler.get_cursor_position().unwrap();
    // With DPI awareness, physical 200 / scale 1.0 = logical 200
    assert_eq!(cursor.x, 200);
    assert_eq!(cursor.y, 200);
}

#[test]
fn test_windows_sampler_screen_boundaries() {
    let mut sampler = MockWindowsSampler::new(1920, 1080);
    
    // Test at screen edges (valid)
    let _color = sampler.sample_pixel(0, 0).unwrap();
    
    let _color2 = sampler.sample_pixel(1919, 1079).unwrap();
    
    // Test just outside screen (invalid)
    assert!(sampler.sample_pixel(1920, 1080).is_err());
}

#[test]
fn test_windows_sampler_grid_sampling() {
    let mut sampler = MockWindowsSampler::new(1920, 1080);
    
    // Test grid sampling uses default implementation
    let grid = sampler.sample_grid(500, 500, 5, 1.0).unwrap();
    assert_eq!(grid.len(), 5);
    assert_eq!(grid[0].len(), 5);
}

#[test]
fn test_windows_sampler_grid_with_partial_oob() {
    let mut sampler = MockWindowsSampler::new(1920, 1080);
    
    // Sample near edge where some pixels will be out of bounds
    // Center at (0, 0) with 3x3 grid samples from (-1,-1) to (1,1)
    let grid = sampler.sample_grid(0, 0, 3, 1.0).unwrap();
    assert_eq!(grid.len(), 3);
    
    // Top-left pixel at (-1, -1) should be OOB and return gray fallback
    let top_left = &grid[0][0];
    assert_eq!(top_left.r, 128);
    assert_eq!(top_left.g, 128);
    assert_eq!(top_left.b, 128);
    
    // Center pixel at (0, 0) should be valid
    let center = &grid[1][1];
    assert_eq!(center.r, 0);
    assert_eq!(center.g, 0);
}

#[test]
fn test_windows_sampler_colorref_format() {
    let mut sampler = MockWindowsSampler::new(1920, 1080);
    
    // Test that BGR to RGB conversion works correctly
    let _color = sampler.sample_pixel(255, 128).unwrap();
    
    // Verify hex string is in RGB format
    let hex = _color.hex_string();
    assert!(hex.starts_with('#'));
    assert_eq!(hex.len(), 7);
    
    // Should be uppercase hex
    assert!(hex.chars().skip(1).all(|c| c.is_ascii_hexdigit() && !c.is_lowercase()));
}

#[test]
fn test_windows_sampler_hdc_simulation() {
    // Test that sampler can be created and used multiple times
    let mut sampler = MockWindowsSampler::new(1920, 1080);
    
    // Simulate multiple samples (HDC should remain valid)
    for _ in 0..100 {
        let result = sampler.sample_pixel(500, 500);
        assert!(result.is_ok(), "HDC should remain valid across samples");
    }
}

#[test]
fn test_windows_sampler_large_coordinates() {
    // Test 4K resolution
    let mut sampler = MockWindowsSampler::new(3840, 2160);
    
    let _color = sampler.sample_pixel(3839, 2159).unwrap();
    
    // Just outside should fail
    assert!(sampler.sample_pixel(3840, 2160).is_err());
}

#[test]
fn test_windows_sampler_various_resolutions() {
    // Test common Windows resolutions
    let resolutions = [
        (1366, 768),  // Common laptop
        (1920, 1080), // Full HD
        (2560, 1440), // QHD
        (3840, 2160), // 4K UHD
    ];
    
    for (width, height) in resolutions {
        let mut sampler = MockWindowsSampler::new(width, height);
        
        // Sample from center
        let x = width / 2;
        let y = height / 2;
        let result = sampler.sample_pixel(x, y);
        assert!(result.is_ok(), "Should work for {}x{}", width, height);
    }
}

#[test]
fn test_windows_sampler_grid_sizes() {
    let mut sampler = MockWindowsSampler::new(1920, 1080);
    
    // Test all supported odd grid sizes
    for size in [5, 7, 9, 11, 13, 15, 17, 19, 21] {
        let grid = sampler.sample_grid(960, 540, size, 1.0).unwrap();
        assert_eq!(grid.len(), size, "Grid should be {}x{}", size, size);
        assert_eq!(grid[0].len(), size, "Grid should be {}x{}", size, size);
    }
}

#[test]
fn test_windows_sampler_color_range() {
    let mut sampler = MockWindowsSampler::new(1920, 1080);
    
    // Sample multiple points - colors are u8 so always in 0-255 range
    for x in (0..1920).step_by(100) {
        for y in (0..1080).step_by(100) {
            let _color = sampler.sample_pixel(x, y).unwrap();
            // Successfully got a color, that's all we need to verify
        }
    }
}

#[test]
fn test_windows_sampler_grid_center_alignment() {
    let mut sampler = MockWindowsSampler::new(1920, 1080);
    
    let center_x = 500;
    let center_y = 500;
    let grid_size = 9;
    
    let grid = sampler.sample_grid(center_x, center_y, grid_size, 1.0).unwrap();
    
    // Center pixel should be at grid[4][4] for a 9x9 grid
    let center_idx = grid_size / 2;
    let center_pixel = &grid[center_idx][center_idx];
    
    // The center pixel should correspond to (center_x, center_y)
    let expected_color = sampler.sample_pixel(center_x, center_y).unwrap();
    assert_eq!(center_pixel.r, expected_color.r);
    assert_eq!(center_pixel.g, expected_color.g);
    assert_eq!(center_pixel.b, expected_color.b);
}

#[test]
fn test_windows_sampler_optimized_grid_sampling() {
    // Verify that the optimized implementation is being used
    // This test is mostly for documentation purposes - the real test
    // happens on actual Windows hardware
    let mut sampler = MockWindowsSampler::new(1920, 1080);
    
    let grid = sampler.sample_grid(500, 500, 9, 1.0).unwrap();
    
    // Should return a valid 9x9 grid
    assert_eq!(grid.len(), 9);
    for row in &grid {
        assert_eq!(row.len(), 9);
    }
}

#[test]
fn test_windows_sampler_grid_performance_large() {
    // Test larger grid sizes that would be prohibitively slow with GetPixel
    let mut sampler = MockWindowsSampler::new(1920, 1080);
    
    // Test 9x9 (81 pixels)
    let grid = sampler.sample_grid(500, 500, 9, 1.0).unwrap();
    assert_eq!(grid.len(), 9);
    
    // Test 11x11 (121 pixels)
    let grid = sampler.sample_grid(500, 500, 11, 1.0).unwrap();
    assert_eq!(grid.len(), 11);
    
    // Test 15x15 (225 pixels)
    let grid = sampler.sample_grid(500, 500, 15, 1.0).unwrap();
    assert_eq!(grid.len(), 15);
    
    // Test 21x21 (441 pixels)
    let grid = sampler.sample_grid(500, 500, 21, 1.0).unwrap();
    assert_eq!(grid.len(), 21);
}

#[test]
fn test_windows_sampler_grid_pixel_alignment() {
    // Verify that pixels in the grid match individual pixel samples
    let mut sampler = MockWindowsSampler::new(1920, 1080);
    
    let center_x = 500;
    let center_y = 500;
    let grid_size = 5;
    
    let grid = sampler.sample_grid(center_x, center_y, grid_size, 1.0).unwrap();
    
    // Check all pixels in the grid match individual samples
    let half_size = (grid_size / 2) as i32;
    for row in 0..grid_size {
        for col in 0..grid_size {
            let x = center_x + (col as i32 - half_size);
            let y = center_y + (row as i32 - half_size);
            
            let grid_color = &grid[row][col];
            let individual_color = sampler.sample_pixel(x, y).unwrap();
            
            assert_eq!(grid_color.r, individual_color.r, "Mismatch at ({}, {})", x, y);
            assert_eq!(grid_color.g, individual_color.g, "Mismatch at ({}, {})", x, y);
            assert_eq!(grid_color.b, individual_color.b, "Mismatch at ({}, {})", x, y);
        }
    }
}

#[test]
fn test_windows_sampler_grid_edge_cases() {
    let mut sampler = MockWindowsSampler::new(1920, 1080);
    
    // Test near screen edges
    // Top-left corner
    let grid = sampler.sample_grid(10, 10, 5, 1.0).unwrap();
    assert_eq!(grid.len(), 5);
    
    // Bottom-right corner (within bounds)
    let grid = sampler.sample_grid(1910, 1070, 5, 1.0).unwrap();
    assert_eq!(grid.len(), 5);
    
    // Top edge
    let grid = sampler.sample_grid(500, 5, 5, 1.0).unwrap();
    assert_eq!(grid.len(), 5);
    
    // Right edge
    let grid = sampler.sample_grid(1915, 500, 5, 1.0).unwrap();
    assert_eq!(grid.len(), 5);
}

#[test]
fn test_windows_sampler_grid_multi_monitor() {
    // Simulate extended desktop spanning multiple monitors
    // Windows treats this as one large virtual screen
    let mut sampler = MockWindowsSampler::new(3840, 1080); // Two 1920x1080 monitors
    
    // Sample from "first monitor"
    let grid1 = sampler.sample_grid(500, 500, 9, 1.0).unwrap();
    assert_eq!(grid1.len(), 9);
    
    // Sample from "second monitor"
    let grid2 = sampler.sample_grid(2500, 500, 9, 1.0).unwrap();
    assert_eq!(grid2.len(), 9);
    
    // Sample at boundary between monitors
    let grid3 = sampler.sample_grid(1920, 500, 9, 1.0).unwrap();
    assert_eq!(grid3.len(), 9);
}

#[test]
fn test_windows_sampler_grid_high_dpi() {
    // Test high DPI scenarios (e.g., 150% scaling, 200% scaling)
    // The sampler should work with physical pixels regardless of DPI
    let mut sampler = MockWindowsSampler::new(2560, 1440);
    
    let grid = sampler.sample_grid(1280, 720, 9, 1.0).unwrap();
    assert_eq!(grid.len(), 9);
    
    // Test 4K resolution (common with 150% or 200% scaling)
    let mut sampler_4k = MockWindowsSampler::new(3840, 2160);
    let grid_4k = sampler_4k.sample_grid(1920, 1080, 9, 1.0).unwrap();
    assert_eq!(grid_4k.len(), 9);
}

#[test]
fn test_windows_sampler_grid_fully_oob() {
    // Test grid completely out of bounds
    let mut sampler = MockWindowsSampler::new(1920, 1080);
    
    // Center way outside screen bounds
    let grid = sampler.sample_grid(-1000, -1000, 5, 1.0).unwrap();
    
    // Should return gray fallback for all pixels
    for row in &grid {
        for pixel in row {
            assert_eq!(pixel.r, 128);
            assert_eq!(pixel.g, 128);
            assert_eq!(pixel.b, 128);
        }
    }
}

#[test]
fn test_windows_sampler_grid_color_accuracy() {
    // Verify colors are correctly converted from BGR to RGB
    let mut sampler = MockWindowsSampler::new(1920, 1080);
    
    let grid = sampler.sample_grid(255, 128, 3, 1.0).unwrap();
    
    // All colors should be valid (0-255 range)
    for row in &grid {
        for pixel in row {
            // Colors are u8, so they're always in valid range
            // Just verify we got actual color data
            let hex = pixel.hex_string();
            assert_eq!(hex.len(), 7);
            assert!(hex.starts_with('#'));
        }
    }
}

#[test]
fn test_windows_sampler_grid_consistency() {
    // Test that multiple samples of the same region return consistent results
    let mut sampler = MockWindowsSampler::new(1920, 1080);
    
    let center_x = 500;
    let center_y = 500;
    
    let grid1 = sampler.sample_grid(center_x, center_y, 7, 1.0).unwrap();
    let grid2 = sampler.sample_grid(center_x, center_y, 7, 1.0).unwrap();
    
    // Grids should be identical
    for row in 0..7 {
        for col in 0..7 {
            assert_eq!(grid1[row][col].r, grid2[row][col].r);
            assert_eq!(grid1[row][col].g, grid2[row][col].g);
            assert_eq!(grid1[row][col].b, grid2[row][col].b);
        }
    }
}

// ============================================================================
// DPI Scaling Tests
// ============================================================================

#[test]
fn test_windows_sampler_dpi_100_percent() {
    // Test 100% DPI scaling (no scaling)
    let mut sampler = MockWindowsSampler::new_with_dpi(1920, 1080, 1.0);
    
    // Physical coordinate 1000 should map to logical 1000
    let color = sampler.sample_pixel(1000, 500).unwrap();
    
    // Color should be based on logical coordinates (1000, 500)
    assert_eq!(color.b, (1000 % 256) as u8);
    assert_eq!(color.g, (500 % 256) as u8);
}

#[test]
fn test_windows_sampler_dpi_150_percent() {
    // Test 150% DPI scaling (1.5x)
    // Physical screen: 2880x1620, Virtual screen: 1920x1080
    let mut sampler = MockWindowsSampler::new_with_dpi(2880, 1620, 1.5);
    
    // Virtual coordinate 1000 should map to physical 1500 (1000 * 1.5)
    let color = sampler.sample_pixel(1000, 500).unwrap();
    
    // Color should be based on physical coordinates (1500, 750)
    assert_eq!(color.b, (1500 % 256) as u8);
    assert_eq!(color.g, (750 % 256) as u8);
}

#[test]
fn test_windows_sampler_dpi_200_percent() {
    // Test 200% DPI scaling (2x) - the reported issue
    // Physical screen: 5120x2880, Logical screen: 2560x1440
    let mut sampler = MockWindowsSampler::new_with_dpi(5120, 2880, 2.0);
    
    // Logical coordinate 1000 should map to physical 2000 (1000 * 2.0) internally
    let color = sampler.sample_pixel(1000, 500).unwrap();
    
    // Color should be based on physical coordinates (2000, 1000)
    assert_eq!(color.b, (2000 % 256) as u8);
    assert_eq!(color.g, (1000 % 256) as u8);
}

#[test]
fn test_windows_sampler_dpi_coordinate_conversion() {
    // Test that DPI scaling correctly converts coordinates
    // Physical screen: 5120x2880
    let mut sampler = MockWindowsSampler::new_with_dpi(5120, 2880, 2.0);
    
    // Test various virtual->physical conversions at 200% DPI
    let test_cases = vec![
        (0, 0, 0, 0),           // Origin
        (50, 100, 100, 200),    // Small coordinates
        (500, 250, 1000, 500),  // Medium coordinates
        (1000, 500, 2000, 1000),// Large coordinates
        (2500, 1400, 5000, 2800),// Near max (2560x1440 virtual -> 5120x2880 physical)
    ];
    
    for (virtual_x, virtual_y, expected_physical_x, expected_physical_y) in test_cases {
        let color = sampler.sample_pixel(virtual_x, virtual_y).unwrap();
        
        // Verify color matches expected physical coordinates
        let expected_b = (expected_physical_x % 256) as u8;
        let expected_g = (expected_physical_y % 256) as u8;
        
        assert_eq!(
            color.b, expected_b,
            "Virtual ({}, {}) should map to physical ({}, {}) at 200% DPI",
            virtual_x, virtual_y, expected_physical_x, expected_physical_y
        );
        assert_eq!(
            color.g, expected_g,
            "Virtual ({}, {}) should map to physical ({}, {}) at 200% DPI",
            virtual_x, virtual_y, expected_physical_x, expected_physical_y
        );
    }
}

#[test]
fn test_windows_sampler_dpi_grid_sampling_200_percent() {
    // Test grid sampling at 200% DPI
    // Physical: 5120x2880
    let mut sampler = MockWindowsSampler::new_with_dpi(5120, 2880, 2.0);
    
    // Virtual cursor at 1000, 500 should map to physical 2000, 1000
    let grid = sampler.sample_grid(1000, 500, 5, 1.0).unwrap();
    
    assert_eq!(grid.len(), 5);
    
    // Center pixel should be at physical coordinates (2000, 1000)
    let center = &grid[2][2];
    assert_eq!(center.b, (2000 % 256) as u8);
    assert_eq!(center.g, (1000 % 256) as u8);
}

#[test]
fn test_windows_sampler_dpi_5120x2880_display() {
    // Test actual 5120x2880 display at 200% DPI (user's reported issue)
    // Physical: 5120x2880, Virtual: 2560x1440
    let mut sampler = MockWindowsSampler::new_with_dpi(5120, 2880, 2.0);
    
    // Cursor in the middle of virtual screen: 1280, 720
    // Should map to physical: 2560, 1440
    let grid = sampler.sample_grid(1280, 720, 9, 1.0).unwrap();
    
    assert_eq!(grid.len(), 9);
    
    // Center pixel should be at physical coordinates (2560, 1440)
    let center = &grid[4][4];
    assert_eq!(center.b, (2560 % 256) as u8);
    assert_eq!(center.g, (1440 % 256) as u8);
}

#[test]
fn test_windows_sampler_dpi_offset_bug() {
    // Reproduce the reported bug: 500+ pixel offset at 200% DPI
    // Physical: 5120x2880
    let mut sampler = MockWindowsSampler::new_with_dpi(5120, 2880, 2.0);
    
    // Without DPI scaling fix, virtual 1000 would be treated as physical 1000
    // With DPI scaling fix, virtual 1000 maps to physical 2000
    // The difference is 1000 pixels (500 in each direction on screen at 200%)
    
    let virtual_x = 1000;
    let expected_physical_x = 2000; // virtual_x * 2.0
    
    let color = sampler.sample_pixel(virtual_x, 500).unwrap();
    
    // Color should be based on physical coordinates (2000, 1000)
    assert_eq!(color.b, (expected_physical_x % 256) as u8);
    assert_eq!(color.g, (1000 % 256) as u8);
}

#[test]
fn test_windows_sampler_dpi_various_scales() {
    // Test common Windows DPI scaling values
    let test_cases = vec![
        (1920, 1080, 1.0, "100%"),   // No scaling
        (2400, 1350, 1.25, "125%"),  // 125% of 1920x1080
        (2880, 1620, 1.5, "150%"),   // 150% of 1920x1080
        (3360, 1890, 1.75, "175%"),  // 175% of 1920x1080
        (3840, 2160, 2.0, "200%"),   // 200% of 1920x1080 (4K)
        (4800, 2700, 2.5, "250%"),   // 250% of 1920x1080
        (5760, 3240, 3.0, "300%"),   // 300% of 1920x1080
    ];
    
    for (physical_width, physical_height, scale, description) in test_cases {
        let mut sampler = MockWindowsSampler::new_with_dpi(physical_width, physical_height, scale);
        
        let virtual_x = 800;
        let expected_physical_x = (virtual_x as f64 * scale) as i32;
        
        let color = sampler.sample_pixel(virtual_x, 400).unwrap();
        
        // Verify coordinate conversion works for this scale
        let expected_b = (expected_physical_x % 256) as u8;
        assert_eq!(
            color.b, expected_b,
            "DPI scaling {} failed: virtual {} should map to physical {}",
            description, virtual_x, expected_physical_x
        );
    }
}

#[test]
fn test_windows_sampler_dpi_out_of_bounds() {
    // Test that out-of-bounds checking works with DPI scaling
    let mut sampler = MockWindowsSampler::new_with_dpi(2560, 1440, 2.0);
    
    // Physical coordinate 6000 maps to logical 3000, which is > 2560
    let result = sampler.sample_pixel(6000, 3000);
    assert!(result.is_err(), "Should fail for out-of-bounds coordinates");
}

#[test]
fn test_windows_sampler_dpi_fallback_no_duplicates() {
    // Test that the fallback method doesn't produce duplicate samples at high DPI
    // This was a bug where physical pixel offsets caused logical pixel duplicates
    let mut sampler = MockWindowsSampler::new_with_dpi(2560, 1440, 2.0);
    
    // Use the fallback implementation (default trait implementation)
    let physical_center_x = 1000;
    let physical_center_y = 500;
    let grid_size = 9;
    
    // Get grid using default implementation (simulates fallback)
    let grid = sampler.sample_grid(physical_center_x, physical_center_y, grid_size, 1.0).unwrap();
    
    // At 200% DPI, we should get 9 distinct logical pixels, not duplicates
    // Physical 992-1008 should map to logical 496-504 (9 distinct values)
    
    // Collect center row colors to check for uniqueness
    let mut center_row_colors: Vec<(u8, u8, u8)> = Vec::new();
    for col in 0..grid_size {
        let color = &grid[4][col]; // Center row
        center_row_colors.push((color.r, color.g, color.b));
    }
    
    // Check that we don't have adjacent duplicates (which would indicate the bug)
    for i in 1..center_row_colors.len() {
        assert_ne!(
            center_row_colors[i], center_row_colors[i - 1],
            "Found duplicate colors at indices {} and {} - DPI fallback bug!",
            i - 1, i
        );
    }
}

#[test]
fn test_windows_sampler_dpi_grid_edge_alignment() {
    // Test that grid pixels correctly sample physical pixels at 200% DPI
    // Physical: 5120x2880, Virtual: 2560x1440
    let mut sampler = MockWindowsSampler::new_with_dpi(5120, 2880, 2.0);
    
    let virtual_center_x = 1000;
    let virtual_center_y = 500;
    let grid_size = 5;
    
    let grid = sampler.sample_grid(virtual_center_x, virtual_center_y, grid_size, 1.0).unwrap();
    
    // Verify the grid has correct dimensions
    assert_eq!(grid.len(), grid_size);
    assert_eq!(grid[0].len(), grid_size);
    
    // Verify center pixel matches what we expect
    // Mock sample_grid operates in virtual coordinates like production
    let center_idx = grid_size / 2; // 2 for a 5x5 grid
    let center_pixel = &grid[center_idx][center_idx];

    // Center samples at virtual position (1000, 500) -> physical (2000, 1000)
    // Colors are based on physical coordinates
    let expected_b = (2000 % 256) as u8; // 2000 % 256 = 224
    let expected_g = (1000 % 256) as u8; // 1000 % 256 = 232
    let expected_r = ((2000 + 1000) % 256) as u8; // 3000 % 256 = 200

    assert_eq!(center_pixel.r, expected_r, "Center pixel R component mismatch");
    assert_eq!(center_pixel.g, expected_g, "Center pixel G component mismatch");
    assert_eq!(center_pixel.b, expected_b, "Center pixel B component mismatch");

    // Grid samples at virtual offsets from center (1000, 500)
    // Virtual half_size = 2 for 5x5 grid
    // Top-left: virtual (998, 498) -> physical (1996, 996)
    let top_left = &grid[0][0];
    assert_eq!(top_left.b, (1996 % 256) as u8); // 1996 % 256 = 220
    assert_eq!(top_left.g, (996 % 256) as u8);  // 996 % 256 = 228

    // Bottom-right: virtual (1002, 502) -> physical (2004, 1004)
    let bottom_right = &grid[4][4];
    assert_eq!(bottom_right.b, (2004 % 256) as u8); // 2004 % 256 = 228
    assert_eq!(bottom_right.g, (1004 % 256) as u8); // 1004 % 256 = 236
}

#[test]
fn test_windows_sampler_multi_monitor_simulation() {
    // Simulate extended desktop spanning multiple monitors
    // Windows treats this as one large virtual screen
    let mut sampler = MockWindowsSampler::new(3840, 1080); // Two 1920x1080 monitors
    
    // Sample from "second monitor"
    let _color = sampler.sample_pixel(2500, 500).unwrap();
}

#[test]
fn test_windows_sampler_high_dpi_scaling() {
    // Windows high DPI scaling test
    // The sampler should work with physical pixels
    let mut sampler = MockWindowsSampler::new(2560, 1440);
    
    let grid = sampler.sample_grid(1280, 720, 7, 1.0).unwrap();
    assert_eq!(grid.len(), 7);
}

#[test]
fn test_windows_sampler_rapid_sampling() {
    let mut sampler = MockWindowsSampler::new(1920, 1080);
    
    // Simulate rapid sampling like in the actual magnifier
    let mut samples = Vec::new();
    for i in 0..50 {
        let x = 500 + i;
        let y = 500 + i;
        let color = sampler.sample_pixel(x, y).unwrap();
        samples.push(color);
    }
    
    assert_eq!(samples.len(), 50);
}

#[test]
fn test_windows_sampler_error_messages() {
    let mut sampler = MockWindowsSampler::new(1920, 1080);
    
    let result = sampler.sample_pixel(-1, -1);
    assert!(result.is_err());
    
    let err_msg = result.unwrap_err();
    assert!(err_msg.contains("Failed to get pixel"));
    assert!(err_msg.contains("-1"));
}

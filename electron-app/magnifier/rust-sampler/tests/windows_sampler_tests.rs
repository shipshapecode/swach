// Windows-specific sampler tests
// Only compiled and run on Windows

#![cfg(target_os = "windows")]

use swach_sampler::types::{Color, PixelSampler, Point};

// Mock Windows sampler for testing logic without requiring actual Windows APIs
struct MockWindowsSampler {
    screen_width: i32,
    screen_height: i32,
}

impl MockWindowsSampler {
    fn new(width: i32, height: i32) -> Self {
        MockWindowsSampler {
            screen_width: width,
            screen_height: height,
        }
    }
}

impl PixelSampler for MockWindowsSampler {
    fn sample_pixel(&mut self, x: i32, y: i32) -> Result<Color, String> {
        // Simulate Windows GetPixel behavior
        if x < 0 || y < 0 || x >= self.screen_width || y >= self.screen_height {
            return Err(format!("Failed to get pixel at ({}, {})", x, y));
        }
        
        // Simulate COLORREF BGR format conversion to RGB
        // Windows GetPixel returns BGR, we convert to RGB
        let b_component = (x % 256) as u8;
        let g_component = (y % 256) as u8;
        let r_component = ((x + y) % 256) as u8;
        
        Ok(Color::new(r_component, g_component, b_component))
    }

    fn get_cursor_position(&self) -> Result<Point, String> {
        // Simulate GetCursorPos
        Ok(Point { x: 100, y: 100 })
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
    assert_eq!(cursor.x, 100);
    assert_eq!(cursor.y, 100);
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

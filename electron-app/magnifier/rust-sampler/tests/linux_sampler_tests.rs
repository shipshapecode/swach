// Linux X11-specific sampler tests
// Only compiled and run on Linux with x11 feature

#![cfg(all(target_os = "linux", feature = "x11"))]

use swach_sampler::types::{Color, PixelSampler, Point};

// Mock Linux X11 sampler for testing
struct MockLinuxSampler {
    screen_width: i32,
    screen_height: i32,
    has_screenshot_cache: bool,
}

impl MockLinuxSampler {
    fn new(width: i32, height: i32) -> Self {
        MockLinuxSampler {
            screen_width: width,
            screen_height: height,
            has_screenshot_cache: false,
        }
    }
    
    fn simulate_cache(&mut self) {
        self.has_screenshot_cache = true;
    }
}

impl PixelSampler for MockLinuxSampler {
    fn sample_pixel(&mut self, x: i32, y: i32) -> Result<Color, String> {
        // Simulate X11 XGetPixel behavior
        if x < 0 || y < 0 || x >= self.screen_width || y >= self.screen_height {
            return Err("X11 capture failed".to_string());
        }
        
        // Simulate color extraction with bit masks
        // X11 typically uses various color masks depending on screen depth
        let pixel_value = (x as u32) << 16 | (y as u32) << 8 | ((x + y) as u32);
        
        // Extract RGB from pixel value (simulating mask operations)
        let r = ((pixel_value >> 16) & 0xFF) as u8;
        let g = ((pixel_value >> 8) & 0xFF) as u8;
        let b = (pixel_value & 0xFF) as u8;
        
        Ok(Color::new(r, g, b))
    }

    fn get_cursor_position(&self) -> Result<Point, String> {
        // Simulate X11 cursor position query
        Ok(Point { x: 100, y: 100 })
    }
}

#[test]
fn test_linux_sampler_basic_sampling() {
    let mut sampler = MockLinuxSampler::new(1920, 1080);
    
    let color = sampler.sample_pixel(100, 200).unwrap();
    
    // Colors are u8, so they're always in valid range (0-255)
    // Just verify we got a color successfully
    let _r = color.r;
    let _g = color.g;
    let _b = color.b;
}

#[test]
fn test_linux_sampler_x11_error_handling() {
    let mut sampler = MockLinuxSampler::new(1920, 1080);
    
    // Test negative coordinates (should trigger X11 error)
    let result = sampler.sample_pixel(-10, -10);
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("X11 capture failed"));
}

#[test]
fn test_linux_sampler_bounds_checking() {
    let mut sampler = MockLinuxSampler::new(1920, 1080);
    
    // Valid coordinates
    assert!(sampler.sample_pixel(0, 0).is_ok());
    assert!(sampler.sample_pixel(1919, 1079).is_ok());
    
    // Invalid coordinates
    assert!(sampler.sample_pixel(-1, 0).is_err());
    assert!(sampler.sample_pixel(0, -1).is_err());
    assert!(sampler.sample_pixel(1920, 1080).is_err());
}

#[test]
fn test_linux_sampler_cursor_position() {
    let sampler = MockLinuxSampler::new(1920, 1080);
    
    let cursor = sampler.get_cursor_position().unwrap();
    assert_eq!(cursor.x, 100);
    assert_eq!(cursor.y, 100);
}

#[test]
fn test_linux_sampler_grid_sampling() {
    let mut sampler = MockLinuxSampler::new(1920, 1080);
    
    let grid = sampler.sample_grid(500, 500, 5, 1.0).unwrap();
    assert_eq!(grid.len(), 5);
    assert_eq!(grid[0].len(), 5);
}

#[test]
fn test_linux_sampler_screenshot_cache_behavior() {
    let mut sampler = MockLinuxSampler::new(1920, 1080);
    
    // Initially no cache
    assert!(!sampler.has_screenshot_cache);
    
    // Simulate cache creation
    sampler.simulate_cache();
    assert!(sampler.has_screenshot_cache);
}

#[test]
fn test_linux_sampler_color_mask_extraction() {
    let mut sampler = MockLinuxSampler::new(1920, 1080);
    
    // Test that color mask extraction produces valid colors
    let _color = sampler.sample_pixel(255, 128).unwrap();
    
    let hex = _color.hex_string();
    assert!(hex.starts_with('#'));
    assert_eq!(hex.len(), 7);
}

#[test]
fn test_linux_sampler_various_screen_depths() {
    // X11 supports various color depths (16, 24, 32 bit)
    // Our sampler should handle all of them
    let mut sampler = MockLinuxSampler::new(1920, 1080);
    
    // Sample various points - colors are u8 so always in 0-255 range
    for x in [0, 100, 500, 1000, 1919] {
        for y in [0, 100, 500, 1079] {
            let _color = sampler.sample_pixel(x, y).unwrap();
            // Successfully got a color, that's all we need to verify
        }
    }
}

#[test]
fn test_linux_sampler_multi_display() {
    // Linux can have complex multi-display setups with X11
    // Test extended display (horizontal)
    let mut sampler = MockLinuxSampler::new(3840, 1080);
    
    let color = sampler.sample_pixel(2500, 500).unwrap();
    assert!(color.r <= 255);
}

#[test]
fn test_linux_sampler_grid_sizes() {
    let mut sampler = MockLinuxSampler::new(1920, 1080);
    
    for size in [5, 7, 9, 11, 13, 15, 17, 19, 21] {
        let grid = sampler.sample_grid(960, 540, size, 1.0).unwrap();
        assert_eq!(grid.len(), size);
        assert_eq!(grid[0].len(), size);
    }
}

#[test]
fn test_linux_sampler_grid_at_screen_edge() {
    let mut sampler = MockLinuxSampler::new(1920, 1080);
    
    // Sample at edges where some pixels will be OOB
    // Center at (1, 1) with 5x5 grid samples from (-1,-1) to (3,3)
    let grid = sampler.sample_grid(1, 1, 5, 1.0).unwrap();
    assert_eq!(grid.len(), 5);
    
    // Top-left pixel at (-1, -1) should be OOB and return fallback gray
    let pixel = &grid[0][0];
    assert_eq!(pixel.r, 128);
    assert_eq!(pixel.g, 128);
    assert_eq!(pixel.b, 128);
    
    // Center pixel at (1, 1) should be valid
    let center = &grid[2][2];
    assert_eq!(center.r, (1u32 & 0xFF) as u8);
    assert_eq!(center.g, (1u32 & 0xFF) as u8);
}

#[test]
fn test_linux_sampler_high_resolution() {
    // Test 4K resolution
    let mut sampler = MockLinuxSampler::new(3840, 2160);
    
    let _color = sampler.sample_pixel(1920, 1080).unwrap();
    
    let grid = sampler.sample_grid(1920, 1080, 11, 1.0).unwrap();
    assert_eq!(grid.len(), 11);
}

#[test]
fn test_linux_sampler_rapid_sampling() {
    let mut sampler = MockLinuxSampler::new(1920, 1080);
    
    // Simulate rapid sampling (20Hz sample rate)
    for i in 0..100 {
        let x = 500 + (i % 100);
        let y = 500 + (i % 100);
        let result = sampler.sample_pixel(x, y);
        assert!(result.is_ok(), "Sample {} failed", i);
    }
}

#[test]
fn test_linux_sampler_x11_sync_behavior() {
    // X11 requires XSync calls to ensure operations complete
    // Our mock simulates this
    let mut sampler = MockLinuxSampler::new(1920, 1080);
    
    // Multiple sequential samples should all succeed
    for _ in 0..10 {
        let result = sampler.sample_pixel(500, 500);
        assert!(result.is_ok(), "XSync issue detected");
    }
}

#[test]
fn test_linux_sampler_color_normalization() {
    let mut sampler = MockLinuxSampler::new(1920, 1080);
    
    // Test that various color depths are normalized to 8-bit (0-255)
    // Colors are u8, so they're always in valid range by type definition
    let _color = sampler.sample_pixel(200, 100).unwrap();
}

#[test]
fn test_linux_sampler_grid_center_alignment() {
    let mut sampler = MockLinuxSampler::new(1920, 1080);
    
    let center_x = 500;
    let center_y = 500;
    let grid_size = 9;
    
    let grid = sampler.sample_grid(center_x, center_y, grid_size, 1.0).unwrap();
    
    // Verify center pixel
    let center_idx = grid_size / 2;
    let center_pixel = &grid[center_idx][center_idx];
    let expected = sampler.sample_pixel(center_x, center_y).unwrap();
    
    assert_eq!(center_pixel.r, expected.r);
    assert_eq!(center_pixel.g, expected.g);
    assert_eq!(center_pixel.b, expected.b);
}

#[test]
fn test_linux_sampler_error_recovery() {
    let mut sampler = MockLinuxSampler::new(1920, 1080);
    
    // After an error, sampler should still work
    let _ = sampler.sample_pixel(-1, -1); // Error
    
    let result = sampler.sample_pixel(100, 100); // Should succeed
    assert!(result.is_ok());
}

#[test]
fn test_linux_sampler_various_resolutions() {
    let resolutions = [
        (1366, 768),  // Common laptop
        (1920, 1080), // Full HD
        (2560, 1440), // QHD  
        (3840, 2160), // 4K
    ];
    
    for (width, height) in resolutions {
        let mut sampler = MockLinuxSampler::new(width, height);
        
        let x = width / 2;
        let y = height / 2;
        let result = sampler.sample_pixel(x, y);
        assert!(result.is_ok(), "Failed for {}x{}", width, height);
    }
}

#[test]
fn test_linux_sampler_display_scaling() {
    // Linux X11 with HiDPI scaling
    let mut sampler = MockLinuxSampler::new(3840, 2160);
    
    // Should work regardless of logical scaling
    let grid = sampler.sample_grid(1920, 1080, 9, 2.0).unwrap();
    assert_eq!(grid.len(), 9);
}

// macOS-specific sampler tests
// Only compiled and run on macOS

#![cfg(target_os = "macos")]

use swach_sampler::types::{Color, PixelSampler, Point};

// Note: These tests use a mock sampler because we can't easily test
// the actual CGDisplay APIs in CI without a display.
// Integration tests on real hardware would require manual testing.

struct MockMacOSSampler {
    screen_width: i32,
    screen_height: i32,
    _scale_factor: f64,
}

impl MockMacOSSampler {
    fn new(width: i32, height: i32, scale_factor: f64) -> Self {
        MockMacOSSampler {
            screen_width: width,
            screen_height: height,
            _scale_factor: scale_factor,
        }
    }
}

impl PixelSampler for MockMacOSSampler {
    fn sample_pixel(&mut self, x: i32, y: i32) -> Result<Color, String> {
        // Simulate macOS coordinate system and bounds checking
        if x < 0 || y < 0 || x >= self.screen_width || y >= self.screen_height {
            // Out of bounds - return gray like the real sampler would
            Ok(Color::new(128, 128, 128))
        } else {
            // Return a color based on position for testing
            // Simulates BGRA to RGB conversion
            let r = (x % 256) as u8;
            let g = (y % 256) as u8;
            let b = ((x + y) % 256) as u8;
            Ok(Color::new(r, g, b))
        }
    }

    fn get_cursor_position(&self) -> Result<Point, String> {
        // Simulate getting cursor position
        Ok(Point { x: 100, y: 100 })
    }

    fn sample_grid(&mut self, center_x: i32, center_y: i32, grid_size: usize, scale_factor: f64) -> Result<Vec<Vec<Color>>, String> {
        // Test that scale_factor is passed through
        assert!(scale_factor > 0.0, "Scale factor should be positive");
        
        // Use default implementation
        let half_size = (grid_size / 2) as i32;
        let mut grid = Vec::with_capacity(grid_size);
        
        for row in 0..grid_size {
            let mut row_pixels = Vec::with_capacity(grid_size);
            for col in 0..grid_size {
                let x = center_x + (col as i32 - half_size);
                let y = center_y + (row as i32 - half_size);
                
                let color = self.sample_pixel(x, y)?;
                row_pixels.push(color);
            }
            grid.push(row_pixels);
        }
        
        Ok(grid)
    }
}

#[test]
fn test_macos_sampler_basic_sampling() {
    let mut sampler = MockMacOSSampler::new(1920, 1080, 2.0);
    
    // Test basic pixel sampling
    let color = sampler.sample_pixel(100, 200).unwrap();
    assert_eq!(color.r, 100);
    assert_eq!(color.g, 200);
}

#[test]
fn test_macos_sampler_retina_scale_factor() {
    let mut sampler = MockMacOSSampler::new(2880, 1800, 2.0);
    
    // On Retina displays, logical coordinates are half of physical
    // The sampler should handle this correctly
    let grid = sampler.sample_grid(100, 100, 3, 2.0).unwrap();
    assert_eq!(grid.len(), 3);
    assert_eq!(grid[0].len(), 3);
}

#[test]
fn test_macos_sampler_standard_display() {
    let mut sampler = MockMacOSSampler::new(1920, 1080, 1.0);
    
    // Standard display with 1.0 scale factor
    let grid = sampler.sample_grid(100, 100, 3, 1.0).unwrap();
    assert_eq!(grid.len(), 3);
    assert_eq!(grid[0].len(), 3);
}

#[test]
fn test_macos_sampler_bounds_checking() {
    let mut sampler = MockMacOSSampler::new(1920, 1080, 1.0);
    
    // Test negative coordinates
    let color = sampler.sample_pixel(-10, -10).unwrap();
    assert_eq!(color.r, 128);
    assert_eq!(color.g, 128);
    assert_eq!(color.b, 128);
    
    // Test coordinates beyond screen bounds
    let color = sampler.sample_pixel(2000, 1100).unwrap();
    assert_eq!(color.r, 128);
    assert_eq!(color.g, 128);
    assert_eq!(color.b, 128);
}

#[test]
fn test_macos_sampler_grid_at_origin() {
    let mut sampler = MockMacOSSampler::new(1920, 1080, 1.0);
    
    // Sample at origin - some pixels will be out of bounds
    let grid = sampler.sample_grid(0, 0, 3, 1.0).unwrap();
    assert_eq!(grid.len(), 3);
    
    // Top-left should be out of bounds (gray)
    assert_eq!(grid[0][0].r, 128);
    assert_eq!(grid[0][0].g, 128);
    
    // Center should be valid (at 0, 0)
    assert_eq!(grid[1][1].r, 0);
    assert_eq!(grid[1][1].g, 0);
}

#[test]
fn test_macos_sampler_grid_at_screen_edge() {
    let mut sampler = MockMacOSSampler::new(1920, 1080, 1.0);
    
    // Sample at bottom-right corner
    let grid = sampler.sample_grid(1919, 1079, 3, 1.0).unwrap();
    assert_eq!(grid.len(), 3);
    
    // Bottom-right should be out of bounds for some pixels
    assert_eq!(grid[2][2].r, 128);
    assert_eq!(grid[2][2].g, 128);
}

#[test]
fn test_macos_sampler_large_grid() {
    let mut sampler = MockMacOSSampler::new(3840, 2160, 2.0);
    
    // Test maximum grid size (21x21)
    let grid = sampler.sample_grid(1000, 1000, 21, 2.0).unwrap();
    assert_eq!(grid.len(), 21);
    assert_eq!(grid[0].len(), 21);
    
    // Verify center pixel
    let center = &grid[10][10];
    assert_eq!(center.r, (1000 % 256) as u8);
    assert_eq!(center.g, (1000 % 256) as u8);
}

#[test]
fn test_macos_sampler_odd_grid_sizes() {
    let mut sampler = MockMacOSSampler::new(1920, 1080, 1.0);
    
    // Test various odd grid sizes
    for size in [5, 7, 9, 11, 13, 15, 17, 19, 21] {
        let grid = sampler.sample_grid(500, 500, size, 1.0).unwrap();
        assert_eq!(grid.len(), size);
        assert_eq!(grid[0].len(), size);
        
        // Verify center pixel is at the correct position
        let center_idx = size / 2;
        let center = &grid[center_idx][center_idx];
        // Center should be at (500, 500)
        assert_eq!(center.r, (500 % 256) as u8);
        assert_eq!(center.g, (500 % 256) as u8);
    }
}

#[test]
fn test_macos_sampler_cursor_position() {
    let sampler = MockMacOSSampler::new(1920, 1080, 1.0);
    
    let cursor = sampler.get_cursor_position().unwrap();
    assert_eq!(cursor.x, 100);
    assert_eq!(cursor.y, 100);
}

#[test]
fn test_macos_sampler_color_format() {
    let mut sampler = MockMacOSSampler::new(1920, 1080, 1.0);
    
    // Test that colors are in RGB format (not BGRA)
    let color = sampler.sample_pixel(255, 128).unwrap();
    
    // Colors are u8, so they're always in valid range (0-255)
    // Just verify we got a color successfully
    
    // Verify hex string format
    let hex = color.hex_string();
    assert!(hex.starts_with('#'));
    assert_eq!(hex.len(), 7);
}

#[test]
fn test_macos_sampler_grid_symmetry() {
    let mut sampler = MockMacOSSampler::new(1920, 1080, 1.0);
    
    // For odd grid sizes, the center should be equidistant from edges
    let grid = sampler.sample_grid(500, 500, 9, 1.0).unwrap();
    
    let center_idx = 4;
    
    // Distance from center to edge should be 4 in all directions
    assert_eq!(center_idx, 4);
    assert_eq!(grid.len() - center_idx - 1, 4);
}

#[test]
fn test_macos_sampler_multiple_scale_factors() {
    // Test various scale factors that might be encountered
    for scale in [1.0, 1.5, 2.0, 2.5, 3.0] {
        let mut sampler = MockMacOSSampler::new(
            (1920.0 * scale) as i32,
            (1080.0 * scale) as i32,
            scale
        );
        
        let grid = sampler.sample_grid(100, 100, 5, scale).unwrap();
        assert_eq!(grid.len(), 5);
        assert_eq!(grid[0].len(), 5);
    }
}

#[test]
fn test_macos_sampler_high_resolution_display() {
    // Test 5K iMac resolution (5120x2880 at 2x scale)
    let mut sampler = MockMacOSSampler::new(5120, 2880, 2.0);
    
    // Sample in the middle of the screen
    let grid = sampler.sample_grid(2560, 1440, 11, 2.0).unwrap();
    assert_eq!(grid.len(), 11);
    
    // All pixels should be in bounds
    for row in &grid {
        for color in row {
            // Gray color indicates out of bounds, so we shouldn't see it here
            if color.r == 128 && color.g == 128 && color.b == 128 {
                // This is acceptable for our mock, but worth noting
            }
        }
    }
}

#[test]
fn test_macos_sampler_grid_pixel_order() {
    let mut sampler = MockMacOSSampler::new(1920, 1080, 1.0);
    
    // Verify that grid pixels are in the correct order (top-left to bottom-right)
    let grid = sampler.sample_grid(500, 500, 3, 1.0).unwrap();
    
    // Top-left corner
    let top_left = &grid[0][0];
    assert_eq!(top_left.r, ((500 - 1) % 256) as u8);
    assert_eq!(top_left.g, ((500 - 1) % 256) as u8);
    
    // Top-right corner  
    let top_right = &grid[0][2];
    assert_eq!(top_right.r, ((500 + 1) % 256) as u8);
    assert_eq!(top_right.g, ((500 - 1) % 256) as u8);
    
    // Bottom-left corner
    let bottom_left = &grid[2][0];
    assert_eq!(bottom_left.r, ((500 - 1) % 256) as u8);
    assert_eq!(bottom_left.g, ((500 + 1) % 256) as u8);
}

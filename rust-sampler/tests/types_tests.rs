use swach_sampler::types::{Color, ColorData, Command, PixelData, PixelSampler, Point};

#[test]
fn test_color_creation() {
    let color = Color::new(255, 128, 64);
    assert_eq!(color.r, 255);
    assert_eq!(color.g, 128);
    assert_eq!(color.b, 64);
}

#[test]
fn test_color_hex_string() {
    let color = Color::new(255, 128, 64);
    assert_eq!(color.hex_string(), "#FF8040");
}

#[test]
fn test_color_hex_all_zeros() {
    let color = Color::new(0, 0, 0);
    assert_eq!(color.hex_string(), "#000000");
}

#[test]
fn test_color_hex_all_ones() {
    let color = Color::new(255, 255, 255);
    assert_eq!(color.hex_string(), "#FFFFFF");
}

#[test]
fn test_color_to_color_data() {
    let color = Color::new(100, 150, 200);
    let data: ColorData = color.into();
    assert_eq!(data.r, 100);
    assert_eq!(data.g, 150);
    assert_eq!(data.b, 200);
    assert_eq!(data.hex, "#6496C8");
}

#[test]
fn test_point_creation() {
    let point = Point { x: 100, y: 200 };
    assert_eq!(point.x, 100);
    assert_eq!(point.y, 200);
}

#[test]
fn test_point_negative_coords() {
    let point = Point { x: -50, y: -100 };
    assert_eq!(point.x, -50);
    assert_eq!(point.y, -100);
}

#[test]
fn test_command_start_deserialization() {
    let json = r#"{"command":"start","grid_size":9,"sample_rate":20}"#;
    let cmd: Command = serde_json::from_str(json).unwrap();
    match cmd {
        Command::Start { grid_size, sample_rate } => {
            assert_eq!(grid_size, 9);
            assert_eq!(sample_rate, 20);
        }
        _ => panic!("Expected Start command"),
    }
}

#[test]
fn test_command_update_grid_deserialization() {
    let json = r#"{"command":"update_grid","grid_size":15}"#;
    let cmd: Command = serde_json::from_str(json).unwrap();
    match cmd {
        Command::UpdateGrid { grid_size } => {
            assert_eq!(grid_size, 15);
        }
        _ => panic!("Expected UpdateGrid command"),
    }
}

#[test]
fn test_command_stop_deserialization() {
    let json = r#"{"command":"stop"}"#;
    let cmd: Command = serde_json::from_str(json).unwrap();
    match cmd {
        Command::Stop => {}
        _ => panic!("Expected Stop command"),
    }
}

#[test]
fn test_pixel_data_serialization() {
    let pixel_data = PixelData {
        cursor: Point { x: 100, y: 200 },
        center: ColorData {
            r: 255,
            g: 128,
            b: 64,
            hex: "#FF8040".to_string(),
        },
        grid: vec![vec![
            ColorData {
                r: 0,
                g: 0,
                b: 0,
                hex: "#000000".to_string(),
            },
            ColorData {
                r: 255,
                g: 255,
                b: 255,
                hex: "#FFFFFF".to_string(),
            },
        ]],
        timestamp: 1234567890,
    };

    let json = serde_json::to_string(&pixel_data).unwrap();
    assert!(json.contains("\"x\":100"));
    assert!(json.contains("\"y\":200"));
    assert!(json.contains("\"r\":255"));
    assert!(json.contains("#FF8040"));
}

// Mock sampler for testing the default grid implementation
struct MockSampler {
    width: i32,
    height: i32,
}

impl PixelSampler for MockSampler {
    fn sample_pixel(&mut self, x: i32, y: i32) -> Result<Color, String> {
        if x < 0 || y < 0 || x >= self.width || y >= self.height {
            Ok(Color::new(128, 128, 128)) // Gray for out of bounds
        } else {
            // Return a color based on position for testing
            Ok(Color::new(x as u8, y as u8, 0))
        }
    }

    fn get_cursor_position(&self) -> Result<Point, String> {
        Ok(Point { x: 100, y: 100 })
    }
}

#[test]
fn test_sample_grid_default_implementation() {
    let mut sampler = MockSampler {
        width: 1000,
        height: 1000,
    };

    let grid = sampler.sample_grid(100, 100, 3, 1.0).unwrap();

    // Should be 3x3
    assert_eq!(grid.len(), 3);
    assert_eq!(grid[0].len(), 3);

    // Center should be at (100, 100)
    let center = &grid[1][1];
    assert_eq!(center.r, 100);
    assert_eq!(center.g, 100);
}

#[test]
fn test_sample_grid_odd_size() {
    let mut sampler = MockSampler {
        width: 1000,
        height: 1000,
    };

    let grid = sampler.sample_grid(50, 50, 5, 1.0).unwrap();

    assert_eq!(grid.len(), 5);
    assert_eq!(grid[0].len(), 5);

    // Center of 5x5 grid should be at index [2][2]
    let center = &grid[2][2];
    assert_eq!(center.r, 50);
    assert_eq!(center.g, 50);
}

#[test]
fn test_sample_grid_bounds_checking() {
    let mut sampler = MockSampler {
        width: 10,
        height: 10,
    };

    // Sample at origin (0, 0) with 3x3 grid
    // This will sample from (-1,-1) to (1,1)
    let grid = sampler.sample_grid(0, 0, 3, 1.0).unwrap();

    // Top-left corner at (-1, -1) should be out of bounds (gray)
    assert_eq!(grid[0][0].r, 128);
    assert_eq!(grid[0][0].g, 128);
    assert_eq!(grid[0][0].b, 128);

    // Center at (0, 0) should be valid (returns x=0, y=0)
    assert_eq!(grid[1][1].r, 0);
    assert_eq!(grid[1][1].g, 0);
}

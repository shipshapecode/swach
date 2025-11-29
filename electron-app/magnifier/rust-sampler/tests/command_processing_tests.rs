// Command processing and JSON parsing tests
// These tests verify the command deserialization and error handling

use swach_sampler::types::{Command, ErrorResponse, PixelData, ColorData, Point};
use serde_json;

#[test]
fn test_start_command_deserialization() {
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
fn test_start_command_with_large_grid() {
    let json = r#"{"command":"start","grid_size":21,"sample_rate":60}"#;
    let cmd: Command = serde_json::from_str(json).unwrap();
    match cmd {
        Command::Start { grid_size, sample_rate } => {
            assert_eq!(grid_size, 21);
            assert_eq!(sample_rate, 60);
        }
        _ => panic!("Expected Start command"),
    }
}

#[test]
fn test_update_grid_command_deserialization() {
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
fn test_update_grid_minimum_size() {
    let json = r#"{"command":"update_grid","grid_size":5}"#;
    let cmd: Command = serde_json::from_str(json).unwrap();
    match cmd {
        Command::UpdateGrid { grid_size } => {
            assert_eq!(grid_size, 5);
        }
        _ => panic!("Expected UpdateGrid command"),
    }
}

#[test]
fn test_update_grid_maximum_size() {
    let json = r#"{"command":"update_grid","grid_size":21}"#;
    let cmd: Command = serde_json::from_str(json).unwrap();
    match cmd {
        Command::UpdateGrid { grid_size } => {
            assert_eq!(grid_size, 21);
        }
        _ => panic!("Expected UpdateGrid command"),
    }
}

#[test]
fn test_stop_command_deserialization() {
    let json = r#"{"command":"stop"}"#;
    let cmd: Command = serde_json::from_str(json).unwrap();
    match cmd {
        Command::Stop => {}
        _ => panic!("Expected Stop command"),
    }
}

#[test]
fn test_invalid_command_fails() {
    let json = r#"{"command":"invalid"}"#;
    let result: Result<Command, _> = serde_json::from_str(json);
    assert!(result.is_err(), "Invalid command should fail to parse");
}

#[test]
fn test_missing_grid_size_fails() {
    let json = r#"{"command":"start","sample_rate":20}"#;
    let result: Result<Command, _> = serde_json::from_str(json);
    assert!(result.is_err(), "Start command missing grid_size should fail");
}

#[test]
fn test_missing_sample_rate_fails() {
    let json = r#"{"command":"start","grid_size":9}"#;
    let result: Result<Command, _> = serde_json::from_str(json);
    assert!(result.is_err(), "Start command missing sample_rate should fail");
}

#[test]
fn test_malformed_json_fails() {
    let json = r#"{"command":"start","grid_size":9"#; // Missing closing brace
    let result: Result<Command, _> = serde_json::from_str(json);
    assert!(result.is_err(), "Malformed JSON should fail to parse");
}

#[test]
fn test_error_response_serialization() {
    let error = ErrorResponse {
        error: "Test error message".to_string(),
    };
    let json = serde_json::to_string(&error).unwrap();
    assert!(json.contains("Test error message"));
    assert!(json.contains("error"));
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
    
    // Verify all expected fields are present
    assert!(json.contains("\"cursor\""));
    assert!(json.contains("\"x\":100"));
    assert!(json.contains("\"y\":200"));
    assert!(json.contains("\"center\""));
    assert!(json.contains("\"r\":255"));
    assert!(json.contains("\"g\":128"));
    assert!(json.contains("\"b\":64"));
    assert!(json.contains("#FF8040"));
    assert!(json.contains("\"grid\""));
    assert!(json.contains("#000000"));
    assert!(json.contains("#FFFFFF"));
    assert!(json.contains("\"timestamp\":1234567890"));
}

#[test]
fn test_pixel_data_deserialization() {
    let json = r##"{"cursor":{"x":50,"y":75},"center":{"r":100,"g":150,"b":200,"hex":"#6496C8"},"grid":[[{"r":10,"g":20,"b":30,"hex":"#0A141E"}]],"timestamp":9876543210}"##;
    
    let pixel_data: PixelData = serde_json::from_str(json).unwrap();
    
    assert_eq!(pixel_data.cursor.x, 50);
    assert_eq!(pixel_data.cursor.y, 75);
    assert_eq!(pixel_data.center.r, 100);
    assert_eq!(pixel_data.center.g, 150);
    assert_eq!(pixel_data.center.b, 200);
    assert_eq!(pixel_data.center.hex, "#6496C8");
    assert_eq!(pixel_data.grid.len(), 1);
    assert_eq!(pixel_data.grid[0].len(), 1);
    assert_eq!(pixel_data.grid[0][0].r, 10);
    assert_eq!(pixel_data.grid[0][0].hex, "#0A141E");
    assert_eq!(pixel_data.timestamp, 9876543210);
}

#[test]
fn test_command_with_extra_fields_ignored() {
    // JSON with extra fields should still parse successfully (forward compatibility)
    let json = r#"{"command":"stop","extra_field":"ignored"}"#;
    let cmd: Command = serde_json::from_str(json).unwrap();
    match cmd {
        Command::Stop => {}
        _ => panic!("Expected Stop command"),
    }
}

#[test]
fn test_start_command_with_zero_sample_rate() {
    // Zero sample rate should parse but may be invalid at runtime
    let json = r#"{"command":"start","grid_size":9,"sample_rate":0}"#;
    let cmd: Command = serde_json::from_str(json).unwrap();
    match cmd {
        Command::Start { grid_size, sample_rate } => {
            assert_eq!(grid_size, 9);
            assert_eq!(sample_rate, 0);
        }
        _ => panic!("Expected Start command"),
    }
}

#[test]
fn test_large_grid_data_serialization() {
    // Test serialization of a large 21x21 grid
    let mut grid = Vec::new();
    for row in 0..21 {
        let mut row_data = Vec::new();
        for col in 0..21 {
            row_data.push(ColorData {
                r: (row * 10) as u8,
                g: (col * 10) as u8,
                b: 128,
                hex: format!("#{:02X}{:02X}80", row * 10, col * 10),
            });
        }
        grid.push(row_data);
    }

    let pixel_data = PixelData {
        cursor: Point { x: 500, y: 500 },
        center: ColorData {
            r: 100,
            g: 100,
            b: 128,
            hex: "#646480".to_string(),
        },
        grid,
        timestamp: 1234567890,
    };

    let json = serde_json::to_string(&pixel_data).unwrap();
    
    // Should be able to serialize without errors
    assert!(json.len() > 1000); // Large grid should produce substantial JSON
    assert!(json.contains("\"grid\""));
    
    // Should be able to deserialize back
    let parsed: PixelData = serde_json::from_str(&json).unwrap();
    assert_eq!(parsed.grid.len(), 21);
    assert_eq!(parsed.grid[0].len(), 21);
}

#[test]
fn test_negative_cursor_coordinates() {
    let pixel_data = PixelData {
        cursor: Point { x: -10, y: -20 },
        center: ColorData {
            r: 0,
            g: 0,
            b: 0,
            hex: "#000000".to_string(),
        },
        grid: vec![vec![ColorData {
            r: 0,
            g: 0,
            b: 0,
            hex: "#000000".to_string(),
        }]],
        timestamp: 0,
    };

    let json = serde_json::to_string(&pixel_data).unwrap();
    assert!(json.contains("\"x\":-10"));
    assert!(json.contains("\"y\":-20"));
    
    let parsed: PixelData = serde_json::from_str(&json).unwrap();
    assert_eq!(parsed.cursor.x, -10);
    assert_eq!(parsed.cursor.y, -20);
}

#[test]
fn test_command_case_sensitivity() {
    // Commands should be case-sensitive
    let json = r#"{"command":"Start","grid_size":9,"sample_rate":20}"#;
    let result: Result<Command, _> = serde_json::from_str(json);
    assert!(result.is_err(), "Command should be case-sensitive");
}

#[test]
fn test_unicode_in_error_message() {
    let error = ErrorResponse {
        error: "Error with unicode: 🎨 测试".to_string(),
    };
    let json = serde_json::to_string(&error).unwrap();
    // ErrorResponse is Serialize only, not Deserialize, so just verify serialization
    assert!(json.contains("Error with unicode"));
}

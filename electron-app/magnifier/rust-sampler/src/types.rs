use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Color {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub hex: [u8; 7], // "#RRGGBB"
}

impl Color {
    pub fn new(r: u8, g: u8, b: u8) -> Self {
        let hex = format!("#{:02X}{:02X}{:02X}", r, g, b);
        let mut hex_bytes = [0u8; 7];
        hex_bytes.copy_from_slice(hex.as_bytes());
        
        Color { r, g, b, hex: hex_bytes }
    }
    
    pub fn hex_string(&self) -> String {
        String::from_utf8_lossy(&self.hex).to_string()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Point {
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PixelData {
    pub cursor: Point,
    pub center: ColorData,
    pub grid: Vec<Vec<ColorData>>,
    pub timestamp: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ColorData {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub hex: String,
}

impl From<Color> for ColorData {
    fn from(color: Color) -> Self {
        ColorData {
            r: color.r,
            g: color.g,
            b: color.b,
            hex: color.hex_string(),
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(tag = "command")]
pub enum Command {
    #[serde(rename = "start")]
    Start {
        grid_size: usize,
        sample_rate: u64,
    },
    #[serde(rename = "update_grid")]
    UpdateGrid {
        grid_size: usize,
    },
    #[serde(rename = "stop")]
    Stop,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

pub trait PixelSampler {
    /// Get the color of a single pixel at the given coordinates
    fn sample_pixel(&mut self, x: i32, y: i32) -> Result<Color, String>;
    
    /// Get cursor position
    fn get_cursor_position(&self) -> Result<Point, String>;

    /// Sample a grid of pixels around a center point
    fn sample_grid(&mut self, center_x: i32, center_y: i32, grid_size: usize, _scale_factor: f64) -> Result<Vec<Vec<Color>>, String> {
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

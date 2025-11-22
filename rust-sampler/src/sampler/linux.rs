use crate::types::{Color, PixelSampler, Point};
use std::env;
use std::process::Command;

pub struct LinuxSampler {
    wayland: bool,
    cached_screenshot: Option<CachedScreenshot>,
}

struct CachedScreenshot {
    data: Vec<u8>,
    width: u32,
    height: u32,
    timestamp: std::time::Instant,
}

impl LinuxSampler {
    pub fn new() -> Result<Self, String> {
        // Detect if we're running on Wayland or X11
        let wayland = env::var("WAYLAND_DISPLAY").is_ok() 
            || env::var("XDG_SESSION_TYPE").map(|s| s == "wayland").unwrap_or(false);
        
        eprintln!("Linux sampler initialized (Wayland: {})", wayland);
        
        Ok(LinuxSampler {
            wayland,
            cached_screenshot: None,
        })
    }

    fn capture_wayland_screenshot(&mut self) -> Result<(), String> {
        // For Wayland, we need to use external tools since direct pixel access is restricted
        // Try grim first (most common on Wayland), then fallback to others
        
        let output = Command::new("grim")
            .arg("-t")
            .arg("ppm") // Use PPM format for easy parsing
            .arg("-")
            .output()
            .map_err(|e| format!("Failed to run grim: {}. Make sure grim is installed for Wayland screenshot support.", e))?;

        if !output.status.success() {
            return Err(format!("grim failed: {}", String::from_utf8_lossy(&output.stderr)));
        }

        let (width, height, data) = Self::parse_ppm(&output.stdout)?;
        
        self.cached_screenshot = Some(CachedScreenshot {
            data,
            width,
            height,
            timestamp: std::time::Instant::now(),
        });

        Ok(())
    }

    fn capture_x11_screenshot(&mut self) -> Result<(), String> {
        // For X11, use import from ImageMagick or scrot
        let output = Command::new("import")
            .arg("-window")
            .arg("root")
            .arg("-depth")
            .arg("8")
            .arg("ppm:-")
            .output()
            .map_err(|e| format!("Failed to run import: {}. Make sure ImageMagick is installed.", e))?;

        if !output.status.success() {
            // Try scrot as fallback
            return self.capture_with_scrot();
        }

        let (width, height, data) = Self::parse_ppm(&output.stdout)?;
        
        self.cached_screenshot = Some(CachedScreenshot {
            data,
            width,
            height,
            timestamp: std::time::Instant::now(),
        });

        Ok(())
    }

    fn capture_with_scrot(&mut self) -> Result<(), String> {
        use std::fs;
        use std::io::Read;

        let temp_file = "/tmp/swach_screenshot.ppm";
        
        let status = Command::new("scrot")
            .arg("-o")
            .arg(temp_file)
            .status()
            .map_err(|e| format!("Failed to run scrot: {}", e))?;

        if !status.success() {
            return Err("scrot failed".to_string());
        }

        let mut file = fs::File::open(temp_file)
            .map_err(|e| format!("Failed to open screenshot file: {}", e))?;

        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer)
            .map_err(|e| format!("Failed to read screenshot file: {}", e))?;

        let (width, height, data) = Self::parse_ppm(&buffer)?;
        
        self.cached_screenshot = Some(CachedScreenshot {
            data,
            width,
            height,
            timestamp: std::time::Instant::now(),
        });

        // Clean up temp file
        let _ = fs::remove_file(temp_file);

        Ok(())
    }

    fn parse_ppm(data: &[u8]) -> Result<(u32, u32, Vec<u8>), String> {
        // Simple PPM P6 (binary) parser
        let mut lines = data.split(|&b| b == b'\n');
        
        // Read magic number
        let magic = lines.next()
            .ok_or_else(|| "Invalid PPM: missing magic number".to_string())?;
        
        if magic != b"P6" {
            return Err(format!("Invalid PPM magic number: expected P6, got {:?}", String::from_utf8_lossy(magic)));
        }

        // Skip comments
        let mut dims_line = lines.next();
        while let Some(line) = dims_line {
            if !line.starts_with(b"#") {
                break;
            }
            dims_line = lines.next();
        }

        let dims_str = String::from_utf8_lossy(
            dims_line.ok_or_else(|| "Invalid PPM: missing dimensions".to_string())?
        );
        
        let dims: Vec<&str> = dims_str.trim().split_whitespace().collect();
        if dims.len() != 2 {
            return Err(format!("Invalid PPM dimensions: {}", dims_str));
        }

        let width: u32 = dims[0].parse()
            .map_err(|e| format!("Invalid width: {}", e))?;
        let height: u32 = dims[1].parse()
            .map_err(|e| format!("Invalid height: {}", e))?;

        // Read max value (should be 255)
        let max_val_line = lines.next()
            .ok_or_else(|| "Invalid PPM: missing max value".to_string())?;
        
        let max_val = String::from_utf8_lossy(max_val_line).trim().parse::<u32>()
            .map_err(|e| format!("Invalid max value: {}", e))?;
        
        if max_val != 255 {
            return Err(format!("Unsupported PPM max value: {}", max_val));
        }

        // The rest is pixel data
        let header_len = data.len() - lines.as_slice().len();
        let pixel_data = &data[header_len..];

        Ok((width, height, pixel_data.to_vec()))
    }

    fn ensure_fresh_screenshot(&mut self) -> Result<(), String> {
        // Refresh screenshot every 100ms for reasonable performance
        let needs_refresh = match &self.cached_screenshot {
            None => true,
            Some(cache) => cache.timestamp.elapsed().as_millis() > 100,
        };

        if needs_refresh {
            if self.wayland {
                self.capture_wayland_screenshot()?;
            } else {
                self.capture_x11_screenshot()?;
            }
        }

        Ok(())
    }
}

impl PixelSampler for LinuxSampler {
    fn sample_pixel(&mut self, x: i32, y: i32) -> Result<Color, String> {
        self.ensure_fresh_screenshot()?;

        let cache = self.cached_screenshot.as_ref()
            .ok_or_else(|| "No screenshot cached".to_string())?;

        if x < 0 || y < 0 || x >= cache.width as i32 || y >= cache.height as i32 {
            return Ok(Color::new(128, 128, 128)); // Gray for out of bounds
        }

        let index = ((y as u32 * cache.width + x as u32) * 3) as usize;
        
        if index + 2 >= cache.data.len() {
            return Ok(Color::new(128, 128, 128));
        }

        // PPM format is RGB
        let r = cache.data[index];
        let g = cache.data[index + 1];
        let b = cache.data[index + 2];

        Ok(Color::new(r, g, b))
    }

    fn get_cursor_position(&self) -> Result<Point, String> {
        // For Wayland, we need to use a different approach
        // Most Wayland compositors don't allow querying cursor position directly
        // We'll need to rely on the application tracking it
        
        if self.wayland {
            // For Wayland, we can't easily get cursor position
            // The application needs to track it via pointer events
            // Return an error to indicate this isn't supported
            return Err("Cursor position querying not supported on Wayland. Use pointer events from compositor.".to_string());
        }

        // For X11, use xdotool
        let output = Command::new("xdotool")
            .arg("getmouselocation")
            .arg("--shell")
            .output()
            .map_err(|e| format!("Failed to get cursor position: {}. Install xdotool for X11 cursor tracking.", e))?;

        if !output.status.success() {
            return Err("xdotool failed".to_string());
        }

        let output_str = String::from_utf8_lossy(&output.stdout);
        let mut x = 0;
        let mut y = 0;

        for line in output_str.lines() {
            if let Some(val) = line.strip_prefix("X=") {
                x = val.parse().unwrap_or(0);
            } else if let Some(val) = line.strip_prefix("Y=") {
                y = val.parse().unwrap_or(0);
            }
        }

        Ok(Point { x, y })
    }
}

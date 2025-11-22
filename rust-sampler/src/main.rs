mod sampler;
mod types;

use sampler::create_sampler;
use std::io::{self, BufRead, Write};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use types::{Color, ColorData, Command, ErrorResponse, PixelData, PixelSampler, Point};

fn main() {
    if let Err(e) = run() {
        eprintln!("Fatal error: {}", e);
        let error = ErrorResponse {
            error: e.to_string(),
        };
        if let Ok(json) = serde_json::to_string(&error) {
            println!("{}", json);
        }
        std::process::exit(1);
    }
}

fn run() -> Result<(), String> {
    eprintln!("Swach pixel sampler starting...");
    
    let mut sampler = create_sampler()?;
    eprintln!("Sampler created successfully");

    let stdin = io::stdin();
    let mut reader = stdin.lock();
    let mut line = String::new();

    // Main loop - wait for commands
    loop {
        line.clear();
        
        match reader.read_line(&mut line) {
            Ok(0) => {
                // EOF - parent process closed
                eprintln!("EOF received, exiting");
                break;
            }
            Ok(_) => {
                let trimmed = line.trim();
                if trimmed.is_empty() {
                    continue;
                }

                match serde_json::from_str::<Command>(trimmed) {
                    Ok(Command::Start { grid_size, sample_rate, exclude_window_id }) => {
                        eprintln!("Starting sampling: grid_size={}, sample_rate={}, exclude_window_id={}", grid_size, sample_rate, exclude_window_id);
                        if let Err(e) = run_sampling_loop(&mut *sampler, grid_size, sample_rate, exclude_window_id, &mut reader) {
                            eprintln!("Sampling loop error: {}", e);
                            send_error(&e);
                        }
                    }
                    Ok(Command::UpdateGrid { grid_size }) => {
                        eprintln!("Grid size update: {}", grid_size);
                        // This would be handled in the sampling loop
                    }
                    Ok(Command::Stop) => {
                        eprintln!("Stop command received");
                        break;
                    }
                    Err(e) => {
                        let error_msg = format!("Failed to parse command: {}", e);
                        eprintln!("{}", error_msg);
                        send_error(&error_msg);
                    }
                }
            }
            Err(e) => {
                let error_msg = format!("Failed to read from stdin: {}", e);
                eprintln!("{}", error_msg);
                send_error(&error_msg);
                break;
            }
        }
    }

    eprintln!("Sampler exiting");
    Ok(())
}

fn run_sampling_loop(
    sampler: &mut dyn PixelSampler,
    grid_size: usize,
    sample_rate: u64,
    exclude_window_id: u32,
    _reader: &mut dyn BufRead,
) -> Result<(), String> {
    // Set the window ID to exclude in the sampler
    sampler.set_exclude_window_id(exclude_window_id);
    eprintln!("[Sampler] Excluding window ID: {}", exclude_window_id);
    let interval = Duration::from_micros(1_000_000 / sample_rate);
    let mut last_cursor = Point { x: -1, y: -1 };
    let mut sample_count = 0;
    let start_time = std::time::Instant::now();
    let mut slow_frame_count = 0;
    
    loop {
        let loop_start = std::time::Instant::now();

        // Get cursor position
        let cursor = match sampler.get_cursor_position() {
            Ok(pos) => {
                // Debug: log first few cursor positions
                if sample_count < 3 {
                    eprintln!("[Sampler] Cursor at ({}, {})", pos.x, pos.y);
                }
                pos
            },
            Err(e) => {
                // On Wayland/some platforms, we can't get cursor position directly
                // Just use the last known position or skip
                eprintln!("Cursor position unavailable: {}", e);
                last_cursor.clone()
            }
        };

        // Debug: log cursor position being used for sampling
        if sample_count < 10 {
            eprintln!("[Sampler] Using cursor ({}, {}) for sampling", cursor.x, cursor.y);
        }

        // TEMPORARY: Test with fixed position to debug color accuracy
        // Use a fixed test position instead of cursor for first few samples
        let test_cursor = if sample_count < 5 {
            Point { x: 100, y: 100 } // Fixed test position
        } else {
            cursor.clone()
        };

        // Sample center pixel
        let _center_color = sampler.sample_pixel(test_cursor.x, test_cursor.y)
            .unwrap_or_else(|e| {
                eprintln!("Failed to sample center pixel: {}", e);
                Color::new(128, 128, 128)
            });

        // Sample every frame regardless of cursor movement for smooth updates
        // This ensures the UI is responsive even if cursor position can't be tracked
        last_cursor = cursor.clone();

        // Sample center pixel
        let center_color = sampler.sample_pixel(cursor.x, cursor.y)
            .unwrap_or_else(|e| {
                eprintln!("Failed to sample center pixel: {}", e);
                Color::new(128, 128, 128)
            });

        // Sample grid
        let grid = sampler.sample_grid(cursor.x, cursor.y, grid_size, 1.0)
            .unwrap_or_else(|e| {
                eprintln!("Failed to sample grid: {}", e);
                vec![vec![Color::new(128, 128, 128); grid_size]; grid_size]
            });

        // Convert to output format
        let grid_data: Vec<Vec<ColorData>> = grid
            .into_iter()
            .map(|row| row.into_iter().map(ColorData::from).collect())
            .collect();

        let pixel_data = PixelData {
            cursor: cursor.clone(),
            center: center_color.into(),
            grid: grid_data,
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
        };

        // Send to stdout
        if let Ok(json) = serde_json::to_string(&pixel_data) {
            println!("{}", json);
            let _ = io::stdout().flush();
        }

        sample_count += 1;
        
        // Print performance stats every 120 samples (every ~6 seconds at 20Hz)
        if sample_count % 120 == 0 {
            let elapsed = start_time.elapsed().as_secs_f64();
            let fps = sample_count as f64 / elapsed;
            eprintln!("Sampling at {:.1} FPS (target: {} FPS)", fps, sample_rate);
            
            // Also report if we're consistently slow
            if slow_frame_count > 0 {
                eprintln!("  {} slow frames in last 120 samples", slow_frame_count);
                slow_frame_count = 0;
            }
        }

        // Sleep to maintain sample rate
        let elapsed = loop_start.elapsed();
        if elapsed < interval {
            std::thread::sleep(interval - elapsed);
        } else {
            // Only log warnings occasionally, not every frame
            slow_frame_count += 1;
            if slow_frame_count == 1 || slow_frame_count % 30 == 0 {
                eprintln!("Warning: frame took {}ms (target: {}ms)", elapsed.as_millis(), interval.as_millis());
            }
        }
    }
    
    Ok(())
}

fn send_error(error: &str) {
    let error_response = ErrorResponse {
        error: error.to_string(),
    };
    if let Ok(json) = serde_json::to_string(&error_response) {
        println!("{}", json);
        let _ = io::stdout().flush();
    }
}

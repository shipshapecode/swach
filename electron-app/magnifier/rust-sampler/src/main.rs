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
    use std::sync::mpsc::{channel, Receiver};
    use std::thread;
    
    eprintln!("Swach pixel sampler starting...");
    
    let mut sampler = create_sampler()?;
    eprintln!("Sampler created successfully");

    // Create channels for command communication
    let (cmd_tx, cmd_rx): (std::sync::mpsc::Sender<Command>, Receiver<Command>) = channel();

    // Spawn stdin reader thread
    thread::spawn(move || {
        let stdin = io::stdin();
        let mut reader = stdin.lock();
        let mut line = String::new();

        loop {
            line.clear();
            match reader.read_line(&mut line) {
                Ok(0) => {
                    eprintln!("[StdinThread] EOF received");
                    let _ = cmd_tx.send(Command::Stop);
                    break;
                }
                Ok(_) => {
                    let trimmed = line.trim();
                    if !trimmed.is_empty() {
                        match serde_json::from_str::<Command>(trimmed) {
                            Ok(cmd) => {
                                let _ = cmd_tx.send(cmd);
                            }
                            Err(e) => {
                                eprintln!("[StdinThread] Failed to parse: {} - Error: {}", trimmed, e);
                            }
                        }
                    }
                }
                Err(e) => {
                    eprintln!("[StdinThread] Read error: {}", e);
                    let _ = cmd_tx.send(Command::Stop);
                    break;
                }
            }
        }
    });

    // Main loop - wait for commands from channel
    loop {
        match cmd_rx.recv() {
            Ok(Command::Start { grid_size, sample_rate }) => {
                eprintln!("Starting sampling: grid_size={}, sample_rate={}", grid_size, sample_rate);
                if let Err(e) = run_sampling_loop(&mut *sampler, grid_size, sample_rate, &cmd_rx) {
                    eprintln!("Sampling loop error: {}", e);
                    send_error(&e);
                }
            }
            Ok(Command::UpdateGrid { .. }) => {
                eprintln!("Update grid command received outside sampling loop (ignored)");
            }
            Ok(Command::Stop) => {
                eprintln!("Stop command received");
                break;
            }
            Err(e) => {
                eprintln!("Channel error: {}", e);
                break;
            }
        }
    }

    eprintln!("Sampler exiting");
    Ok(())
}

fn run_sampling_loop(
    sampler: &mut dyn PixelSampler,
    initial_grid_size: usize,
    sample_rate: u64,
    cmd_rx: &std::sync::mpsc::Receiver<Command>,
) -> Result<(), String> {
    use std::sync::mpsc::TryRecvError;
    
    let interval = Duration::from_micros(1_000_000 / sample_rate);
    let mut last_cursor = Point { x: -1, y: -1 };
    let mut sample_count = 0;
    let start_time = std::time::Instant::now();
    let mut slow_frame_count = 0;
    let mut current_grid_size = initial_grid_size;
    
    loop {
        // Check for commands (non-blocking)
        match cmd_rx.try_recv() {
            Ok(Command::UpdateGrid { grid_size }) => {
                current_grid_size = grid_size;
            }
            Ok(Command::Stop) => {
                eprintln!("[Sampler] Stop command received");
                return Ok(());
            }
            Ok(Command::Start { .. }) => {
                eprintln!("[Sampler] Ignoring nested start command");
            }
            Err(TryRecvError::Disconnected) => {
                eprintln!("[Sampler] Command channel disconnected");
                return Ok(());
            }
            Err(TryRecvError::Empty) => {
                // No command waiting, continue sampling
            }
        }
        
        let loop_start = std::time::Instant::now();

        // Get cursor position (returns logical coordinates, DPI-aware)
        let cursor_pos = match sampler.get_cursor_position() {
            Ok(pos) => pos,
            Err(_e) => {
                // On Wayland/some platforms, we can't get cursor position directly
                // Just use the last known position
                last_cursor.clone()
            }
        };

        // Sample every frame regardless of cursor movement for smooth updates
        // This ensures the UI is responsive even if cursor position can't be tracked
        last_cursor = cursor_pos.clone();

        // Samplers handle DPI internally (like macOS), so pass coordinates directly
        // Sample center pixel
        let center_color = sampler.sample_pixel(cursor_pos.x, cursor_pos.y)
            .unwrap_or_else(|e| {
                eprintln!("Failed to sample center pixel: {}", e);
                Color::new(128, 128, 128)
            });

        // Sample grid
        let grid = sampler.sample_grid(cursor_pos.x, cursor_pos.y, current_grid_size, 1.0)
            .unwrap_or_else(|e| {
                eprintln!("Failed to sample grid: {}", e);
                vec![vec![Color::new(128, 128, 128); current_grid_size]; current_grid_size]
            });

        // Convert to output format
        let grid_data: Vec<Vec<ColorData>> = grid
            .into_iter()
            .map(|row| row.into_iter().map(ColorData::from).collect())
            .collect();

        let pixel_data = PixelData {
            cursor: cursor_pos.clone(),
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

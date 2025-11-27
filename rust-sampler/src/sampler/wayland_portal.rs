// Wayland screen capture using XDG Desktop Portal Screencast + PipeWire
//
// This implementation:
// 1. Uses ashpd to request screencast via Portal
// 2. Stores restore tokens to avoid repeated permission prompts  
// 3. Uses PipeWire to receive video frames
// 4. Samples pixels from the video frames

use crate::types::{Color, PixelSampler, Point};
use ashpd::desktop::screencast::{CursorMode, Screencast, SourceType};
use ashpd::WindowIdentifier;
use pipewire as pw;
use std::sync::{Arc, Mutex};

pub struct WaylandPortalSampler {
    runtime: tokio::runtime::Runtime,
    x11_display: *mut x11::xlib::Display,
    frame_buffer: Arc<Mutex<Option<FrameBuffer>>>,
    pipewire_stream: Option<pw::stream::Stream>,
}

struct FrameBuffer {
    data: Vec<u8>,
    width: u32,
    height: u32,
    stride: usize,
}

impl WaylandPortalSampler {
    pub fn new() -> Result<Self, String> {
        eprintln!("═══════════════════════════════════════════════════════");
        eprintln!("  Initializing Wayland Screen Capture");
        eprintln!("═══════════════════════════════════════════════════════");
        eprintln!();
        eprintln!("Using XDG Desktop Portal for screen access.");
        eprintln!("You may see a permission dialog on first use.");
        eprintln!();
        
        // Still need X11 for cursor position
        let x11_display = unsafe {
            let display = x11::xlib::XOpenDisplay(std::ptr::null());
            if display.is_null() {
                return Err("Failed to open X11 display for cursor tracking".to_string());
            }
            display
        };
        
        // Create tokio runtime for async operations
        let runtime = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .map_err(|e| format!("Failed to create async runtime: {}", e))?;
        
        Ok(WaylandPortalSampler {
            runtime,
            x11_display,
            frame_buffer: Arc::new(Mutex::new(None)),
            pipewire_stream: None,
        })
    }
    
    fn load_restore_token() -> Option<String> {
        let token_path = dirs::data_local_dir()?.join("swach").join("screencast-token");
        std::fs::read_to_string(token_path).ok()
    }
    
    fn save_restore_token(token: &str) -> Result<(), String> {
        let data_dir = dirs::data_local_dir()
            .ok_or("Could not find data directory")?
            .join("swach");
        
        std::fs::create_dir_all(&data_dir)
            .map_err(|e| format!("Failed to create data directory: {}", e))?;
        
        let token_path = data_dir.join("screencast-token");
        std::fs::write(token_path, token)
            .map_err(|e| format!("Failed to save restore token: {}", e))?;
        
        eprintln!("✓ Screen capture permission saved for future use");
        Ok(())
    }
    
    pub fn start_screencast(&mut self) -> Result<(), String> {
        let restore_token = Self::load_restore_token();
        let frame_buffer = Arc::clone(&self.frame_buffer);
        
        if restore_token.is_some() {
            eprintln!("Using saved screen capture permission...");
        } else {
            eprintln!("Requesting screen capture permission...");
            eprintln!("(This dialog will only appear once)");
        }
        
        self.runtime.block_on(async {
            // Connect to screencast portal
            let screencast = Screencast::new().await
                .map_err(|e| format!("Failed to connect to screencast portal: {}", e))?;
            
            // Create screencast session
            let session = screencast.create_session().await
                .map_err(|e| format!("Failed to create screencast session: {}", e))?;
            
            // Build select sources request
            let sources_request = screencast
                .select_sources(
                    &session,
                    CursorMode::Embedded,
                    SourceType::Monitor.into(),
                    false,
                    restore_token.as_deref(),
                )
                .await
                .map_err(|e| format!("Failed to select screencast sources: {}", e))?;
            
            // Start the screencast and get the response
            let streams_response = screencast
                .start(&session, &WindowIdentifier::default())
                .send()
                .await
                .map_err(|e| format!("Failed to start screencast: {}", e))?
                .response()
                .map_err(|e| format!("Failed to get screencast response: {}", e))?;
            
            eprintln!("✓ Screen capture started successfully");
            
            // Save restore token for next time
            if let Some(token) = streams_response.restore_token() {
                if let Err(e) = Self::save_restore_token(token) {
                    eprintln!("Warning: Could not save permission token: {}", e);
                }
            }
            
            // Get PipeWire stream information
            let streams = streams_response.streams();
            if streams.is_empty() {
                return Err("No video streams available".to_string());
            }
            
            let stream = &streams[0];
            let node_id = stream.pipe_wire_node_id();
            
            eprintln!("PipeWire node ID: {}", node_id);
            
            // TODO: Complete PipeWire frame capture implementation
            // The Portal screencast API is working and token persistence is implemented.
            // What remains:
            //
            // 1. Initialize PipeWire mainloop and context
            // 2. Create a PipeWire stream connected to the node_id
            // 3. Set up stream listener to receive video frames
            // 4. Extract frame data (width, height, stride, pixel format)
            // 5. Copy frame data to frame_buffer Arc<Mutex<>> for sampling
            // 6. Run mainloop in background thread
            //
            // References:
            // - pipewire-rs examples: https://gitlab.freedesktop.org/pipewire/pipewire-rs
            // - screencast example: https://github.com/Doukindou/screencast-rs
            //
            // For now, return an error to indicate this is not yet fully functional
            
            Err("PipeWire frame capture not yet implemented. Portal+token persistence works, but frame streaming needs completion.".to_string())
        })
    }
}

impl Drop for WaylandPortalSampler {
    fn drop(&mut self) {
        unsafe {
            x11::xlib::XCloseDisplay(self.x11_display);
        }
    }
}

impl PixelSampler for WaylandPortalSampler {
    fn sample_pixel(&mut self, x: i32, y: i32) -> Result<Color, String> {
        let buffer = self.frame_buffer.lock().unwrap();
        let frame = buffer.as_ref()
            .ok_or("No frame available - screencast not started or no frames received yet")?;
        
        if x < 0 || y < 0 || x >= frame.width as i32 || y >= frame.height as i32 {
            return Ok(Color::new(128, 128, 128));
        }
        
        let offset = (y as usize * frame.stride) + (x as usize * 4);
        
        if offset + 3 >= frame.data.len() {
            return Ok(Color::new(128, 128, 128));
        }
        
        // Assuming BGRA format (common in PipeWire)
        let b = frame.data[offset];
        let g = frame.data[offset + 1];
        let r = frame.data[offset + 2];
        
        Ok(Color::new(r, g, b))
    }
    
    fn get_cursor_position(&self) -> Result<Point, String> {
        unsafe {
            let root = x11::xlib::XDefaultRootWindow(self.x11_display);
            
            let mut root_return = 0;
            let mut child_return = 0;
            let mut root_x = 0;
            let mut root_y = 0;
            let mut win_x = 0;
            let mut win_y = 0;
            let mut mask_return = 0;
            
            let result = x11::xlib::XQueryPointer(
                self.x11_display,
                root,
                &mut root_return,
                &mut child_return,
                &mut root_x,
                &mut root_y,
                &mut win_x,
                &mut win_y,
                &mut mask_return,
            );
            
            if result == 0 {
                return Err("Failed to query pointer".to_string());
            }
            
            Ok(Point { x: root_x, y: root_y })
        }
    }
    
    fn sample_grid(&mut self, center_x: i32, center_y: i32, grid_size: usize, _scale_factor: f64) -> Result<Vec<Vec<Color>>, String> {
        let half_size = (grid_size / 2) as i32;
        let mut grid = Vec::with_capacity(grid_size);
        
        for row in 0..grid_size {
            let mut row_pixels = Vec::with_capacity(grid_size);
            for col in 0..grid_size {
                let x = center_x + (col as i32 - half_size);
                let y = center_y + (row as i32 - half_size);
                
                let color = self.sample_pixel(x, y)
                    .unwrap_or(Color::new(128, 128, 128));
                row_pixels.push(color);
            }
            grid.push(row_pixels);
        }
        
        Ok(grid)
    }
}

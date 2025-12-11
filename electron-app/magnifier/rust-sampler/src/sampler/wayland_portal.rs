// Wayland screen capture using XDG Desktop Portal Screencast + PipeWire
//
// This implementation:
// 1. Uses ashpd to request screencast via Portal
// 2. Stores restore tokens to avoid repeated permission prompts  
// 3. Takes a screenshot on each sample request (not live streaming)
// 4. Samples pixels from the screenshot buffer
//
// NOTE: This approach does not provide live updates like the macOS/Windows samplers.
// The screen is captured once per sample/grid request. This is a limitation of 
// Wayland's security model - we cannot exclude windows (like the magnifier) from
// PipeWire video streams, so we use screenshots instead to avoid capturing the
// magnifier window overlay.

use crate::types::{Color, PixelSampler, Point};
use ashpd::desktop::screencast::{CursorMode, Screencast, SourceType};
use ashpd::desktop::PersistMode;
use ashpd::WindowIdentifier;
use pipewire as pw;
use std::sync::{Arc, Mutex};

pub struct WaylandPortalSampler {
    runtime: tokio::runtime::Runtime,
    x11_display: *mut x11::xlib::Display,
    screenshot_buffer: Arc<Mutex<Option<ScreenshotBuffer>>>,
    pipewire_node_id: Option<u32>,
    restore_token: Option<String>,
    screenshot_captured: bool, // Track if we've already captured the initial screenshot
}

struct ScreenshotBuffer {
    data: Vec<u8>,
    width: u32,
    height: u32,
    stride: usize,
}

impl WaylandPortalSampler {
    pub fn new() -> Result<Self, String> {
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
        
        // Load any existing restore token
        let restore_token = Self::load_restore_token();
        
        Ok(WaylandPortalSampler {
            runtime,
            x11_display,
            screenshot_buffer: Arc::new(Mutex::new(None)),
            pipewire_node_id: None,
            restore_token,
            screenshot_captured: false,
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
    
    pub fn request_permission(&mut self) -> Result<(), String> {
        self.ensure_screencast_permission()
    }
    
    fn ensure_screencast_permission(&mut self) -> Result<(), String> {
        // If we already have a node ID, permission is granted
        if self.pipewire_node_id.is_some() {
            return Ok(());
        }
        
        let restore_token = self.restore_token.clone();
        
        if restore_token.is_none() {
            eprintln!("Requesting screen capture permission...");
        }
        
        // Get the PipeWire node ID from the portal
        let (node_id, new_token) = self.runtime.block_on(async {
            // Connect to screencast portal
            let screencast = Screencast::new().await
                .map_err(|e| format!("Failed to connect to screencast portal: {}", e))?;
            
            // Create screencast session
            let session = screencast.create_session().await
                .map_err(|e| format!("Failed to create screencast session: {}", e))?;
            
            // Select sources
            screencast
                .select_sources(
                    &session,
                    CursorMode::Hidden, // Don't include cursor in screenshots
                    SourceType::Monitor.into(),
                    false,
                    restore_token.as_deref(),
                    PersistMode::ExplicitlyRevoked,
                )
                .await
                .map_err(|e| format!("Failed to select screencast sources: {}", e))?;
            
            // Start the screencast
            let start_request = screencast
                .start(&session, &WindowIdentifier::default())
                .await
                .map_err(|e| format!("Failed to start screencast: {}", e))?;
            
            // Get the response
            let streams_response = start_request.response()
                .map_err(|e| format!("Failed to get screencast response: {}", e))?;
            
            eprintln!("✓ Screen capture permission granted");
            
            // Get PipeWire node ID and restore token
            let streams = streams_response.streams();
            if streams.is_empty() {
                return Err("No PipeWire streams available".to_string());
            }
            
            let node_id = streams[0].pipe_wire_node_id();
            let new_token = streams_response.restore_token().map(|s| s.to_string());
            
            Ok::<(u32, Option<String>), String>((node_id, new_token))
        })?;
        
        // Save restore token if we got a new one
        if let Some(token) = new_token {
            self.restore_token = Some(token.clone());
            if let Err(e) = Self::save_restore_token(&token) {
                eprintln!("Warning: Could not save permission token: {}", e);
            }
        }
        
        self.pipewire_node_id = Some(node_id);
        eprintln!("✓ Screen capture initialized");
        
        Ok(())
    }
    
    // Capture a screenshot from the PipeWire stream
    fn capture_screenshot(&mut self) -> Result<(), String> {
        let node_id = self.pipewire_node_id
            .ok_or("Screen capture not initialized - call request_permission first")?;
        
        // Initialize PipeWire
        pw::init();
        
        // Create PipeWire main loop (using Rc variant for 0.9 API)
        let mainloop = pw::main_loop::MainLoopRc::new(None)
            .map_err(|_| "Failed to create PipeWire main loop".to_string())?;
        
        // Create PipeWire context (0.9 API requires None parameter for properties)
        let context = pw::context::ContextRc::new(&mainloop, None)
            .map_err(|_| "Failed to create PipeWire context".to_string())?;
        
        // Connect to PipeWire core
        let core = context.connect_rc(None)
            .map_err(|_| "Failed to connect to PipeWire".to_string())?;
        
        // Create a stream (using Box variant for 0.9 API)
        let stream = pw::stream::StreamBox::new(
            &core,
            "swach-screenshot",
            pw::properties::properties! {
                *pw::keys::MEDIA_TYPE => "Video",
                *pw::keys::MEDIA_CATEGORY => "Capture",
                *pw::keys::MEDIA_ROLE => "Screen",
            },
        ).map_err(|_| "Failed to create PipeWire stream".to_string())?;
        
        // Buffer to store the screenshot
        let screenshot_buffer = Arc::clone(&self.screenshot_buffer);
        let frame_captured = Arc::new(std::sync::atomic::AtomicBool::new(false));
        let frame_captured_clone = Arc::clone(&frame_captured);
        
        // Video format info
        let video_info: Arc<Mutex<Option<(u32, u32, usize)>>> = Arc::new(Mutex::new(None));
        let video_info_clone = Arc::clone(&video_info);
        let video_info_process = Arc::clone(&video_info);
        
        // Add listener to receive one frame
        let _listener = stream
            .add_local_listener_with_user_data(screenshot_buffer)
            .param_changed(move |_stream, _user_data, id, param| {
                use pw::spa::param::ParamType;
                
                if id != ParamType::Format.as_raw() {
                    return;
                }
                
                if let Some(param) = param {
                    use pw::spa::param::video::VideoInfoRaw;
                    
                    if let Ok((_media_type, _media_subtype)) = pw::spa::param::format_utils::parse_format(param) {
                        let mut info = VideoInfoRaw::default();
                        if let Ok(_) = info.parse(param) {
                            let size = info.size();
                            let width = size.width;
                            let height = size.height;
                            let stride = width as usize * 4; // BGRA format
                            
                            if let Ok(mut vi) = video_info_clone.lock() {
                                *vi = Some((width, height, stride));
                            }
                        }
                    }
                }
            })
            .process(move |stream, user_data| {
                // Only capture one frame
                if frame_captured_clone.load(std::sync::atomic::Ordering::SeqCst) {
                    return;
                }
                
                match stream.dequeue_buffer() {
                    None => {}
                    Some(mut buffer) => {
                        let datas = buffer.datas_mut();
                        if datas.is_empty() {
                            return;
                        }
                        
                        let data = &mut datas[0];
                        let chunk = data.chunk();
                        let size = chunk.size() as usize;
                        
                        if size == 0 {
                            return;
                        }
                        
                        // Get video format
                        let format_info = if let Ok(vi) = video_info_process.lock() {
                            *vi
                        } else {
                            None
                        };
                        
                        // Get frame data
                        if let Some(slice) = data.data() {
                            if slice.len() >= size {
                                let pixel_data = slice[..size].to_vec();
                                
                                if let Some((width, height, stride)) = format_info {
                                    if width > 0 && height > 0 {
                                        eprintln!("[Wayland] Captured screenshot: {}x{} ({} bytes)", width, height, pixel_data.len());
                                        if let Ok(mut buf) = user_data.lock() {
                                            *buf = Some(ScreenshotBuffer {
                                                data: pixel_data,
                                                width,
                                                height,
                                                stride,
                                            });
                                            frame_captured_clone.store(true, std::sync::atomic::Ordering::SeqCst);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })
            .register()
            .map_err(|e| format!("Failed to register stream listener: {:?}", e))?;
        
        // Connect stream to the PipeWire node
        stream.connect(
            pw::spa::utils::Direction::Input,
            Some(node_id),
            pw::stream::StreamFlags::AUTOCONNECT | pw::stream::StreamFlags::MAP_BUFFERS,
            &mut [],
        )
        .map_err(|e| format!("Failed to connect stream: {:?}", e))?;
        
        // Iterate mainloop until we capture one frame (timeout after 5 seconds)
        let start_time = std::time::Instant::now();
        let timeout = std::time::Duration::from_secs(5);
        
        while !frame_captured.load(std::sync::atomic::Ordering::SeqCst) {
            if start_time.elapsed() > timeout {
                return Err("Timeout waiting for screenshot frame".to_string());
            }
            
            let _ = mainloop.loop_().iterate(std::time::Duration::from_millis(10));
        }
        
        Ok(())
    }
    
    fn ensure_screenshot_captured(&mut self) -> Result<(), String> {
        self.ensure_screencast_permission()?;
        
        if !self.screenshot_captured {
            self.capture_screenshot()?;
            self.screenshot_captured = true;
        }
        
        Ok(())
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
        self.ensure_screenshot_captured()?;
        
        let buffer = self.screenshot_buffer.lock().unwrap();
        let screenshot = buffer.as_ref()
            .ok_or("No screenshot available")?;
        
        if x < 0 || y < 0 || x >= screenshot.width as i32 || y >= screenshot.height as i32 {
            return Ok(Color::new(128, 128, 128));
        }
        
        let offset = (y as usize * screenshot.stride) + (x as usize * 4);
        
        if offset + 3 >= screenshot.data.len() {
            return Ok(Color::new(128, 128, 128));
        }
        
        // Assuming BGRA format
        let b = screenshot.data[offset];
        let g = screenshot.data[offset + 1];
        let r = screenshot.data[offset + 2];
        
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
        self.ensure_screenshot_captured()?;
        
        let buffer = self.screenshot_buffer.lock().unwrap();
        let screenshot = buffer.as_ref()
            .ok_or("No screenshot available")?;
        
        let half_size = (grid_size / 2) as i32;
        let mut grid = Vec::with_capacity(grid_size);
        
        for row in 0..grid_size {
            let mut row_pixels = Vec::with_capacity(grid_size);
            for col in 0..grid_size {
                let x = center_x + (col as i32 - half_size);
                let y = center_y + (row as i32 - half_size);
                
                // Sample from the screenshot buffer
                let color = if x < 0 || y < 0 || x >= screenshot.width as i32 || y >= screenshot.height as i32 {
                    Color::new(128, 128, 128)
                } else {
                    let offset = (y as usize * screenshot.stride) + (x as usize * 4);
                    
                    if offset + 3 >= screenshot.data.len() {
                        Color::new(128, 128, 128)
                    } else {
                        // Assuming BGRA format
                        let b = screenshot.data[offset];
                        let g = screenshot.data[offset + 1];
                        let r = screenshot.data[offset + 2];
                        Color::new(r, g, b)
                    }
                };
                
                row_pixels.push(color);
            }
            grid.push(row_pixels);
        }
        
        Ok(grid)
    }
}

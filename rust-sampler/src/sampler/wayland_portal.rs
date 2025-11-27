// Wayland screen capture using XDG Desktop Portal Screencast + PipeWire
//
// This implementation:
// 1. Uses ashpd to request screencast via Portal
// 2. Stores restore tokens to avoid repeated permission prompts  
// 3. Uses PipeWire to receive video frames
// 4. Samples pixels from the video frames

use crate::types::{Color, PixelSampler, Point};
use ashpd::desktop::screencast::{CursorMode, Screencast, SourceType};
use ashpd::desktop::PersistMode;
use ashpd::WindowIdentifier;
use pipewire as pw;
use std::sync::{Arc, Mutex};

pub struct WaylandPortalSampler {
    runtime: tokio::runtime::Runtime,
    x11_display: *mut x11::xlib::Display,
    frame_buffer: Arc<Mutex<Option<FrameBuffer>>>,
    _pipewire_mainloop: Option<pw::main_loop::MainLoop>,
    _pipewire_stream: Option<pw::stream::Stream>,
    _stream_listener: Option<pw::stream::StreamListener<Arc<Mutex<Option<FrameBuffer>>>>>,
    screencast_started: std::sync::Arc<std::sync::atomic::AtomicBool>,
}

struct FrameBuffer {
    data: Vec<u8>,
    width: u32,
    height: u32,
    stride: usize,
}

// Helper function to estimate screen dimensions from pixel count
// This is a heuristic for common screen resolutions
fn estimate_dimensions(pixel_count: usize) -> (u32, u32) {
    let common_resolutions = [
        (3840, 2160), // 4K
        (2560, 1440), // 1440p
        (1920, 1080), // 1080p
        (1680, 1050),
        (1600, 900),
        (1440, 900),
        (1366, 768),
        (1280, 1024),
        (1280, 800),
        (1280, 720),
        (1024, 768),
    ];
    
    for &(w, h) in &common_resolutions {
        if w * h == pixel_count as u32 {
            return (w, h);
        }
    }
    
    // If no exact match, try to find closest aspect ratio
    let sqrt = (pixel_count as f64).sqrt() as u32;
    let mut best = (0, 0);
    let mut best_diff = u32::MAX;
    
    for &(w, h) in &common_resolutions {
        let diff = (w as i64 - sqrt as i64).abs() as u32;
        if diff < best_diff {
            best_diff = diff;
            best = (w, h);
        }
    }
    
    best
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
            _pipewire_mainloop: None,
            _pipewire_stream: None,
            _stream_listener: None,
            screencast_started: std::sync::Arc::new(std::sync::atomic::AtomicBool::new(false)),
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
        self.ensure_screencast_started()
    }
    
    fn ensure_screencast_started(&mut self) -> Result<(), String> {
        // Check if already started
        if self.screencast_started.load(std::sync::atomic::Ordering::SeqCst) {
            return Ok(());
        }
        
        self.start_screencast()?;
        self.screencast_started.store(true, std::sync::atomic::Ordering::SeqCst);
        Ok(())
    }
    
    fn start_screencast(&mut self) -> Result<(), String> {
        let restore_token = Self::load_restore_token();
        let frame_buffer = Arc::clone(&self.frame_buffer);
        
        if restore_token.is_some() {
            eprintln!("Using saved screen capture permission...");
        } else {
            eprintln!("Requesting screen capture permission...");
            eprintln!("(This dialog will only appear once)");
        }
        
        // Get the PipeWire node ID from the portal
        let node_id = self.runtime.block_on(async {
            // Connect to screencast portal
            let screencast = Screencast::new().await
                .map_err(|e| format!("Failed to connect to screencast portal: {}", e))?;
            
            // Create screencast session
            let session = screencast.create_session().await
                .map_err(|e| format!("Failed to create screencast session: {}", e))?;
            
            // Build select sources request
            screencast
                .select_sources(
                    &session,
                    CursorMode::Embedded,
                    SourceType::Monitor.into(),
                    false,
                    restore_token.as_deref(),
                    PersistMode::ExplicitlyRevoked,
                )
                .await
                .map_err(|e| format!("Failed to select screencast sources: {}", e))?;
            
            // Start the screencast and get the response
            let start_request = screencast
                .start(&session, &WindowIdentifier::default())
                .await
                .map_err(|e| format!("Failed to start screencast: {}", e))?;
            
            // Get the actual response data
            let streams_response = start_request.response()
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
            
            Ok::<u32, String>(node_id)
        })?;
        
        // Initialize PipeWire
        eprintln!("Initializing PipeWire...");
        unsafe {
            pw::init();
        }
        
        // Create PipeWire main loop
        let mainloop = pw::main_loop::MainLoop::new(None)
            .map_err(|_| "Failed to create PipeWire main loop".to_string())?;
        
        // Create PipeWire context (pass MainLoop directly, it implements IsLoopRc)
        let context = pw::context::Context::new(&mainloop)
            .map_err(|_| "Failed to create PipeWire context".to_string())?;
        
        // Connect to PipeWire core
        let core = context.connect(None)
            .map_err(|_| "Failed to connect to PipeWire".to_string())?;
        
        // Create a stream
        let stream = pw::stream::Stream::new(
            &core,
            "swach-screencast",
            pw::properties::properties! {
                *pw::keys::MEDIA_TYPE => "Video",
                *pw::keys::MEDIA_CATEGORY => "Capture",
                *pw::keys::MEDIA_ROLE => "Screen",
            },
        ).map_err(|_| "Failed to create PipeWire stream".to_string())?;
        
        // Add listener to receive frames
        let frame_buffer_clone = Arc::clone(&frame_buffer);
        
        // Store video format info
        let video_info: Arc<Mutex<Option<(u32, u32, usize)>>> = Arc::new(Mutex::new(None));
        let video_info_clone = Arc::clone(&video_info);
        
        let listener = stream
            .add_local_listener_with_user_data(frame_buffer_clone)
            .state_changed(move |_stream, _user_data, old, new| {
                eprintln!("PipeWire stream state: {:?} -> {:?}", old, new);
            })
            .param_changed(move |_stream, _user_data, id, param| {
                use pw::spa::param::ParamType;
                
                // Only care about Format params
                if id != ParamType::Format.as_raw() {
                    return;
                }
                
                if let Some(param) = param {
                    // Try to extract video format information
                    use pw::spa::param::video::VideoInfoRaw;
                    
                    if let Ok((media_type, media_subtype)) = pw::spa::param::format_utils::parse_format(param) {
                        eprintln!("Stream format: {:?}/{:?}", media_type, media_subtype);
                        
                        // Try to parse as video format
                        let mut info = VideoInfoRaw::new();
                        if let Ok(_) = info.parse(param) {
                            let size = info.size();
                            let width = size.width;
                            let height = size.height;
                            
                            // Calculate stride from width and format (assume 4 bytes per pixel for BGRA)
                            let stride = width as usize * 4;
                            
                            eprintln!("Video format: {}x{} stride={}", width, height, stride);
                            
                            if let Ok(mut vi) = video_info_clone.lock() {
                                *vi = Some((width, height, stride));
                            }
                        } else {
                            eprintln!("Could not parse video format");
                        }
                    }
                }
            })
            .process(|stream, user_data| {
                // This callback is called for each video frame
                match stream.dequeue_buffer() {
                    None => {
                        // No buffer available - this is normal, just return
                    }
                    Some(mut buffer) => {
                        let datas = buffer.datas_mut();
                        if datas.is_empty() {
                            return;
                        }
                        
                        let data = &mut datas[0];
                        
                        // Get the chunk data (contains actual pixel data)
                        let chunk = data.chunk();
                        let size = chunk.size() as usize;
                        
                        if size == 0 {
                            return;
                        }
                        
                        // Get video format info from stored state
                        let format_info = if let Ok(vi) = video_info.lock() {
                            *vi
                        } else {
                            None
                        };
                        
                        // Get frame data
                        if let Some(slice) = data.data() {
                            if slice.len() >= size {
                                let pixel_data = slice[..size].to_vec();
                                
                                let (width, height, stride) = if let Some((w, h, s)) = format_info {
                                    // Use parsed format info
                                    (w, h, s)
                                } else {
                                    // Fallback: estimate dimensions
                                    let pixel_count = size / 4;
                                    let (w, h) = estimate_dimensions(pixel_count);
                                    let s = w as usize * 4;
                                    (w, h, s)
                                };
                                
                                if width > 0 && height > 0 {
                                    if let Ok(mut fb) = user_data.lock() {
                                        *fb = Some(FrameBuffer {
                                            data: pixel_data,
                                            width,
                                            height,
                                            stride,
                                        });
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
        eprintln!("Connecting to PipeWire node {}...", node_id);
        
        stream.connect(
            pw::spa::utils::Direction::Input,
            Some(node_id),
            pw::stream::StreamFlags::AUTOCONNECT | pw::stream::StreamFlags::MAP_BUFFERS,
            &mut [],
        )
        .map_err(|e| format!("Failed to connect stream: {:?}", e))?;
        
        eprintln!("✓ PipeWire stream connected successfully");
        
        // Store the stream and mainloop so they don't get dropped
        self._pipewire_stream = Some(stream);
        self._stream_listener = Some(listener);
        self._pipewire_mainloop = Some(mainloop);
        
        // Iterate the mainloop a few times to kick off the stream
        // This allows format negotiation and initial frames to be received
        eprintln!("Starting PipeWire mainloop iterations...");
        for _i in 0..10 {
            if let Some(ref ml) = self._pipewire_mainloop {
                ml.loop_().iterate(pw::loop_::Timeout::Finite(std::time::Duration::from_millis(50)));
            }
        }
        
        eprintln!("✓ Screen capture fully initialized");
        
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
        // Ensure screencast is started (lazy initialization)
        self.ensure_screencast_started()?;
        
        // Iterate mainloop to process new frames
        if let Some(ref ml) = self._pipewire_mainloop {
            ml.loop_().iterate(pw::loop_::Timeout::Finite(std::time::Duration::from_millis(1)));
        }
        
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
        // Ensure screencast is started (lazy initialization)
        self.ensure_screencast_started()?;
        
        // Iterate mainloop to process new frames
        if let Some(ref ml) = self._pipewire_mainloop {
            ml.loop_().iterate(pw::loop_::Timeout::Finite(std::time::Duration::from_millis(1)));
        }
        
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

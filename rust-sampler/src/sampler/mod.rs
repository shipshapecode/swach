#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "macos")]
pub use macos::MacOSSampler;

#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "linux")]
pub use linux::LinuxSampler;

// Wayland support (optional, requires the "wayland" feature)
#[cfg(all(target_os = "linux", feature = "wayland"))]
mod wayland;
#[cfg(all(target_os = "linux", feature = "wayland"))]
mod wayland_portal;
#[cfg(all(target_os = "linux", feature = "wayland"))]
pub use wayland_portal::WaylandPortalSampler;

#[cfg(target_os = "windows")]
mod windows;
#[cfg(target_os = "windows")]
pub use windows::WindowsSampler;

use crate::types::PixelSampler;

pub fn create_sampler() -> Result<Box<dyn PixelSampler>, String> {
    #[cfg(target_os = "macos")]
    {
        Ok(Box::new(MacOSSampler::new()?))
    }
    
    #[cfg(target_os = "linux")]
    {
        // Try X11 direct capture first (best performance)
        match LinuxSampler::new() {
            Ok(sampler) => {
                eprintln!("Using X11 direct capture");
                return Ok(Box::new(sampler));
            }
            Err(e) => {
                eprintln!("X11 capture unavailable: {}", e);
                
                #[cfg(feature = "wayland")]
                {
                    eprintln!("Attempting Wayland Portal capture with PipeWire...");
                    match WaylandPortalSampler::new() {
                        Ok(mut sampler) => {
                            // Start the screencast session
                            sampler.start_screencast()?;
                            eprintln!("✓ Wayland Portal capture initialized");
                            return Ok(Box::new(sampler));
                        }
                        Err(e) => {
                            eprintln!("✗ Wayland Portal capture failed: {}", e);
                        }
                    }
                }
                
                #[cfg(not(feature = "wayland"))]
                {
                    eprintln!("Wayland support not compiled in. Rebuild with --features wayland");
                }
                
                Err(format!("No working screen capture method available: {}", e))
            }
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        Ok(Box::new(WindowsSampler::new()?))
    }
    
    #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
    {
        Err("Unsupported platform".to_string())
    }
}

#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "macos")]
pub use macos::MacOSSampler;

#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "linux")]
pub use linux::LinuxSampler;

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
        Ok(Box::new(LinuxSampler::new()?))
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

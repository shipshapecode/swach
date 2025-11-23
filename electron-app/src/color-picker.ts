import { type Menubar } from 'menubar';

// Rust-based implementation (fast, works on macOS, Windows, Linux X11)
import { launchMagnifyingColorPicker as launchRustPicker } from '../magnifier/magnifier-main-rust.js';
// Electron-based implementation (fallback for Wayland)
import { launchMagnifyingColorPicker as launchElectronPicker } from '../magnifier/magnifier-main.js';

let useElectronFallback = false;

async function launchPicker(mb: Menubar, type = 'global') {
  await launchMagnifyingColorPicker(mb, type);
}

async function launchMagnifyingColorPicker(mb: Menubar, type = 'global') {
  // On Linux, try Rust first, fall back to Electron on Wayland
  if (process.platform === 'linux' && !useElectronFallback) {
    try {
      await launchRustPicker(mb, type);
      return;
    } catch (error) {
      console.warn(
        '[Color Picker] Rust sampler failed, falling back to Electron implementation:',
        error
      );
      console.log(
        '[Color Picker] This is expected on Wayland - using Electron desktopCapturer'
      );
      useElectronFallback = true;
      // Fall through to Electron implementation
    }
  }

  // Use Electron fallback (Wayland) or for non-Linux platforms use Rust
  if (useElectronFallback) {
    await launchElectronPicker(mb, type);
  } else {
    await launchRustPicker(mb, type);
  }
}

export { launchPicker, launchMagnifyingColorPicker };

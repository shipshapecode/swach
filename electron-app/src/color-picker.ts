import { type Menubar } from 'menubar';

// Rust-based implementation (fast, works on macOS, Windows, Linux (X11, Wayland)).
import { launchMagnifyingColorPicker as launchRustPicker } from '../magnifier/magnifier-main-rust.js';
// Electron-based implementation fallback for when the rust picker fails.
import { launchMagnifyingColorPicker as launchElectronPicker } from '../magnifier/magnifier-main.js';

async function launchPicker(mb: Menubar, type = 'global') {
  try {
    await launchRustPicker(mb, type);
    return;
  } catch (error) {
    console.warn(
      '[Color Picker] Rust sampler failed, falling back to Electron implementation:',
      error
    );

    await launchElectronPicker(mb, type);
  }
}

export { launchPicker };

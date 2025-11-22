import { type Menubar } from 'menubar';

// Use Rust-based implementation for continuous pixel sampling
import { launchMagnifyingColorPicker } from '../magnifier/magnifier-main-rust.js';

// Old screenshot-based implementation (deprecated)
// import { launchMagnifyingColorPicker } from '../magnifier/magnifier-main.js';

async function launchPicker(mb: Menubar, type = 'global') {
  await launchMagnifyingColorPicker(mb, type);
}

export { launchPicker, launchMagnifyingColorPicker };

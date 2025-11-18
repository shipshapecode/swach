import { type Menubar } from 'menubar';

import { launchMagnifyingColorPicker } from '../magnifier/magnifier-main.js';

async function launchPicker(mb: Menubar, type = 'global') {
  await launchMagnifyingColorPicker(mb, type);
}

export { launchPicker, launchMagnifyingColorPicker };

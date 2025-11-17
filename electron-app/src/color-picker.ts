import { type Menubar } from 'menubar';

import { launchMagnifyingColorPicker } from './magnifying-color-picker';

async function launchPicker(mb: Menubar, type = 'global') {
  await launchMagnifyingColorPicker(mb, type);
}

export { launchPicker, launchMagnifyingColorPicker };

import { type Menubar } from 'menubar';

import { launchMagnifyingColorPicker } from '../../magnifier-renderer/magnifier-main';

async function launchPicker(mb: Menubar, type = 'global') {
  await launchMagnifyingColorPicker(mb, type);
}

export { launchPicker, launchMagnifyingColorPicker };

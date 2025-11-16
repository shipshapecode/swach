import { type Menubar } from 'menubar';

import { launchMagnifyingColorPicker } from './magnifying-color-picker';

// Main color picker function - uses the magnifying glass implementation
async function launchPicker(mb: Menubar, type = 'global') {
  await launchMagnifyingColorPicker(mb, type);
}

// Original EyeDropper implementation as fallback
async function launchOriginalPicker(mb: Menubar, type = 'global') {
  mb.hideWindow();

  const color = await mb.window!.webContents.executeJavaScript(
    `
  async function openEyeDropper() {
    const eyeDropper = new EyeDropper();

    let color = '';

    try {
      const result = await eyeDropper.open();
      color = result.sRGBHex;
    } catch (error) {
      console.warn(\`[ERROR] launchPicker EyeDropper\`, error);
    }

    return color;
  }
  
  openEyeDropper();`,
    true
  );

  if (color) {
    if (type === 'global') {
      mb.window!.webContents.send('changeColor', color);
    }
    if (type === 'contrastBg') {
      mb.window!.webContents.send('pickContrastBgColor', color);
    }
    if (type === 'contrastFg') {
      mb.window!.webContents.send('pickContrastFgColor', color);
    }
  }

  void mb.showWindow();
}

export {
  launchPicker,
  launchOriginalPicker,
  launchMagnifyingColorPicker,
};

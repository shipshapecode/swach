async function launchPicker(mb, type = 'global') {
  mb.hideWindow();

  const color = await mb.window.webContents.executeJavaScript(
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
      mb.window.webContents.send('changeColor', color);
    }
    if (type === 'contrastBg') {
      mb.window.webContents.send('pickContrastBgColor', color);
    }
    if (type === 'contrastFg') {
      mb.window.webContents.send('pickContrastFgColor', color);
    }
  }

  mb.showWindow();
}

module.exports = {
  launchPicker
};

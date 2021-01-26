const { getColorHexRGB } = require('electron-color-picker');

async function launchPicker(mb, type = 'global') {
  getColorHexRGB()
    .then((color) => {
      mb.showWindow();
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
    })
    .catch((error) => {
      console.warn(`[ERROR] getColor`, error);
      return '';
    });
}

module.exports = {
  launchPicker
};

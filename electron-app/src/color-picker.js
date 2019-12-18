const {
  getColorHexRGB
} = require('electron-color-picker');

async function launchPicker (mb) {
  getColorHexRGB()
    .then(color => {
      mb.showWindow();
      mb.window.webContents.send('changeColor', color);
    })
    .catch(error => {
      console.warn(`[ERROR] getColor`, error);
      return '';
    });
}

module.exports = {
  launchPicker
};
const {
  darwinGetScreenPermissionGranted,
  darwinRequestScreenPermissionPopup,
  getColorHexRGB
} = require('electron-color-picker');

async function launchPicker (mb) {
  if (process.platform === 'darwin') {
    const permissionsGranted = await darwinGetScreenPermissionGranted();
    if (!permissionsGranted) {
      await darwinRequestScreenPermissionPopup();
    }
  }

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
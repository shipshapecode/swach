const { globalShortcut } = require('electron');

function registerKeyboardShortcuts(mb, launchPicker, openContrastChecker) {
  globalShortcut.register('Ctrl+Super+Alt+p', () => {
    launchPicker(mb);
  });

  globalShortcut.register('Ctrl+Super+Alt+c', () => {
    openContrastChecker(mb);
  });

  mb.app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}

module.exports = {
  registerKeyboardShortcuts
};

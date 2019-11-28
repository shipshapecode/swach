'use strict';

const { BrowserWindow } = require('electron');

module.exports = (dirname) => {
  let win;

  let init = () => {
    if (win === null || win === undefined) {
      // TODO: Make it compatible with Linux.
      if (process.platform === 'darwin' || process.platform === 'win32') {
        createWindow();
      }
    }
  };

  let createWindow = () => {
    win = new BrowserWindow({
      frame: false,
      autoHideMenuBar: true,
      width: 100,
      height: 100,
      hasShadow: false,
      transparent: true,
      alwaysOnTop: true,
      resizable: false,
      focusable: true,
      webPreferences: {
        contextIsolation: false,
        nodeIntegration: true
      }
    });

    // win.webContents.openDevTools();

    win.loadURL(`file://${dirname}/views/picker.html`);
    win.on('closed', () => {
      win = undefined;
    });
  };

  let getWindow = () => win;

  return {
    init: init,
    getWindow: getWindow
  };
};

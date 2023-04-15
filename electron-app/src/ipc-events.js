const { app, clipboard, dialog, ipcMain, nativeTheme } = require('electron');
const { download } = require('electron-dl');
const fs = require('fs');

const { launchPicker } = require('./color-picker');
const { restartDialog } = require('./dialogs');
const { setTouchbar } = require('./touchbar');

function setupEventHandlers(mb, store) {
  ipcMain.on('copyColorToClipboard', (channel, color) => {
    clipboard.writeText(color);
  });

  ipcMain.on('exitApp', () => mb.app.quit());

  ipcMain.on('exportData', async (channel, jsonString) => {
    const downloadPath = `${mb.app.getPath('temp')}/swach-data.json`;
    fs.writeFileSync(downloadPath, jsonString);
    await download(mb.window, `file://${downloadPath}`);
    fs.unlink(downloadPath, (err) => {
      if (err) throw err;
      console.log(`${downloadPath} was deleted`);
    });
  });

  ipcMain.handle('getAppVersion', async () => {
    return app.getVersion();
  });

  ipcMain.handle('getBackupData', async () => {
    const backupPath = `${mb.app.getPath('temp')}/backup-swach-data.json`;
    return fs.readFileSync(backupPath, { encoding: 'utf8' });
  });

  ipcMain.handle('getPlatform', () => {
    return process.platform;
  });

  ipcMain.handle('getStoreValue', (event, key) => {
    return store.get(key);
  });

  ipcMain.handle('getShouldUseDarkColors', () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  });

  ipcMain.handle('importData', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
    });

    if (!canceled && filePaths.length) {
      return fs.readFileSync(filePaths[0], { encoding: 'utf8' });
    }
  });

  ipcMain.on('launchContrastBgPicker', async () => {
    await launchPicker(mb, 'contrastBg');
  });

  ipcMain.on('launchContrastFgPicker', async () => {
    await launchPicker(mb, 'contrastFg');
  });

  ipcMain.on('launchPicker', async () => {
    await launchPicker(mb);
  });

  ipcMain.on('setTouchbar', (event, itemsToShow) => {
    setTouchbar(mb, itemsToShow);
  });

  ipcMain.on('setShowDockIcon', async (channel, showDockIcon) => {
    store.set('showDockIcon', showDockIcon);
    await restartDialog();
  });
}

module.exports = {
  setupEventHandlers,
};

const {
  setupTestem,
  openTestWindow
} = require('ember-electron/lib/test-support');

const { app, ipcMain, nativeTheme } = require('electron');
const Store = require('electron-store');
const path = require('path');

const store = new Store({
  defaults: {
    firstRun: true,
    needsMigration: true,
    showDockIcon: false
  }
});

const handleFileUrls = require('../src/handle-file-urls');

const emberAppDir = path.resolve(__dirname, '..', 'ember-test');

ipcMain.handle('getAppVersion', async () => {
  return app.getVersion();
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

app.on('ready', async function onReady() {
  await handleFileUrls(emberAppDir);
  setupTestem();
  openTestWindow(emberAppDir);
});

app.on('window-all-closed', function onWindowAllClosed() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

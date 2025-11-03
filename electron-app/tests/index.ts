import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, ipcMain, nativeTheme } from 'electron';
import Store from 'electron-store';
import {
  handleFileUrls,
  openTestWindow,
  setupTestem,
} from 'vite-plugin-testem-electron/electron';

// __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const store = new Store({
  defaults: {
    firstRunV1: true,
    needsMigration: true,
    showDockIcon: false,
  },
});

// IPC handlers needed by the app
ipcMain.handle('getAppVersion', () => {
  return app.getVersion();
});

ipcMain.handle('getPlatform', () => {
  return process.platform;
});

ipcMain.handle('getStoreValue', (_event, key: string) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  return store.get(key) as unknown;
});

ipcMain.handle('getShouldUseDarkColors', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
});

const emberAppDir = resolve(__dirname, '..', '..', 'dist');

app.on('ready', function onReady() {
  // Set a global for the preload script to detect test mode
  process.env.ELECTRON_IS_TESTING = 'true';

  handleFileUrls(emberAppDir);

  // Set up testem communication
  setupTestem();

  // Open the test window - testem.js will handle QUnit integration automatically
  openTestWindow(emberAppDir, {
    preloadPath: resolve(__dirname, '..', '..', '.vite', 'build', 'preload.js'),
  });
});

app.on('window-all-closed', function onWindowAllClosed() {
  app.quit();
});

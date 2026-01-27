import fs from 'fs';

import { app, clipboard, dialog, ipcMain, nativeTheme, shell } from 'electron';
import { download } from 'electron-dl';
import type Store from 'electron-store';
import { type Menubar } from 'menubar';

import { launchPicker } from './color-picker';
import { restartDialog } from './dialogs';

// PERFORMANCE LOGGING: Track first call vs subsequent calls
const perfTracking = new Map<
  string,
  { count: number; firstTime?: number; totalTime: number }
>();

function trackPerf(eventName: string, fn: () => void | Promise<void>) {
  const start = Date.now();
  const stats = perfTracking.get(eventName) || { count: 0, totalTime: 0 };

  const result = fn();

  const duration = Date.now() - start;
  stats.count++;
  stats.totalTime += duration;

  if (stats.count === 1) {
    stats.firstTime = duration;
    console.log(`[PERF] ${eventName} FIRST CALL: ${duration}ms`);
  } else {
    const avgOther =
      (stats.totalTime - (stats.firstTime || 0)) / (stats.count - 1);
    console.log(
      `[PERF] ${eventName} call #${stats.count}: ${duration}ms (first: ${stats.firstTime}ms, avg others: ${avgOther.toFixed(1)}ms)`
    );
  }

  perfTracking.set(eventName, stats);
  return result;
}

function setupEventHandlers(
  mb: Menubar,
  store: Store<{ firstRunV1: boolean; showDockIcon: boolean }>
) {
  // Log all IPC messages for debugging
  ipcMain.on('copyColorToClipboard', (_channel, color: string) => {
    console.log('[IPC] Received: copyColorToClipboard');
    trackPerf('copyColorToClipboard', () => clipboard.writeText(color));
  });

  ipcMain.on('exitApp', () => mb.app.quit());

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  ipcMain.on('exportData', async (_channel, jsonString: string) => {
    const downloadPath = `${mb.app.getPath('temp')}/swach-data.json`;
    fs.writeFileSync(downloadPath, jsonString);
    await download(mb.window!, `file://${downloadPath}`);
    fs.unlink(downloadPath, (err) => {
      if (err) throw err;
      console.log(`${downloadPath} was deleted`);
    });
  });

  ipcMain.handle('getAppVersion', () => {
    return app.getVersion();
  });

  ipcMain.handle('getBackupData', () => {
    const backupPath = `${mb.app.getPath('temp')}/backup-swach-data.json`;
    return fs.readFileSync(backupPath, { encoding: 'utf8' });
  });

  ipcMain.handle('getPlatform', () => {
    return process.platform;
  });

  ipcMain.handle('getStoreValue', (_event, key: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
      return fs.readFileSync(filePaths[0]!, { encoding: 'utf8' });
    }
    return null;
  });

  ipcMain.on('launchContrastBgPicker', () => {
    console.log('[IPC] Received: launchContrastBgPicker');
    void trackPerf('launchContrastBgPicker', () =>
      launchPicker(mb, 'contrastBg')
    );
  });

  ipcMain.on('launchContrastFgPicker', () => {
    console.log('[IPC] Received: launchContrastFgPicker');
    void trackPerf('launchContrastFgPicker', () =>
      launchPicker(mb, 'contrastFg')
    );
  });

  ipcMain.on('launchPicker', () => {
    console.log('[IPC] Received: launchPicker');
    void trackPerf('launchPicker', () => launchPicker(mb));
  });

  ipcMain.on('launchContrastFgPicker', () => {
    void trackPerf('launchContrastFgPicker', () =>
      launchPicker(mb, 'contrastFg')
    );
  });

  ipcMain.on('launchPicker', () => {
    void trackPerf('launchPicker', () => launchPicker(mb));
  });

  ipcMain.handle('open-external', async (_event, url: string) => {
    await shell.openExternal(url);
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  ipcMain.on('setShowDockIcon', async (_channel, showDockIcon) => {
    store.set('showDockIcon', showDockIcon);
    await restartDialog();
  });
}

export { setupEventHandlers };

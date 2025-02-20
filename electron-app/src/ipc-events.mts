import {
  BrowserWindow,
  app,
  clipboard,
  dialog,
  ipcMain,
  nativeTheme,
} from 'electron';
import { download } from 'electron-dl';
import Store from 'electron-store';
import * as fs from 'fs';
import { type Menubar } from 'menubar';

import { launchPicker } from './color-picker.mjs';
import { restartDialog } from './dialogs.mjs';

export function setupEventHandlers(mb: Menubar, store: Store): void {
  ipcMain.on('copyColorToClipboard', (_event, color: string) => {
    clipboard.writeText(color);
  });

  ipcMain.on('exitApp', () => mb.app.quit());

  ipcMain.on('exportData', async (_event, jsonString: string) => {
    const downloadPath = `${mb.app.getPath('temp')}/swach-data.json`;
    fs.writeFileSync(downloadPath, jsonString);
    await download(mb.window as BrowserWindow, `file://${downloadPath}`);
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

  ipcMain.handle('getStoreValue', (_event, key: string) => {
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
    return undefined;
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

  ipcMain.on('setShowDockIcon', async (_event, showDockIcon: boolean) => {
    store.set('showDockIcon', showDockIcon);
    await restartDialog();
  });
}

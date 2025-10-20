import fs from 'fs';
import { app, clipboard, dialog, ipcMain, nativeTheme, shell } from 'electron';
import { download } from 'electron-dl';
import type ElectronStore from 'electron-store';
import { type Menubar } from 'menubar';
import { launchPicker } from './color-picker';
import { restartDialog } from './dialogs';

function setupEventHandlers(
  mb: Menubar,
  store: ElectronStore<{ firstRunV1: boolean; showDockIcon: boolean }>
) {
  ipcMain.on('copyColorToClipboard', (_channel, color: string) => {
    clipboard.writeText(color);
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
    void launchPicker(mb, 'contrastBg');
  });

  ipcMain.on('launchContrastFgPicker', () => {
    void launchPicker(mb, 'contrastFg');
  });

  ipcMain.on('launchPicker', () => {
    void launchPicker(mb);
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

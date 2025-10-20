// window.js (ESM)
import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';

export default (_dirname: string, route: string, title: string) => {
  let win: BrowserWindow | null | undefined;

  const init = () => {
    if (win == null) createWindow();
    else win.show();
    // win.webContents.openDevTools();
  };

  const createWindow = () => {
    const options = {
      width: 700,
      height: 500,
      minWidth: 460,
      minHeight: 340,
      fullscreenable: false,
      titleBarStyle: 'hidden',
      title,
      webPreferences: {
        contextIsolation: false,
        nodeIntegration: true,
      },
    } satisfies BrowserWindowConstructorOptions;

    win = new BrowserWindow(options);

    const windowRoute = `serve://dist#/${route}`;
    void win.loadURL(windowRoute);

    win.on('closed', () => {
      win = undefined;
    });

    win.on('page-title-updated', (e) => {
      e.preventDefault();
    });
  };

  const getWindow = () => win;

  return { init, getWindow };
};

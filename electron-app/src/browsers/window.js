// window.js (ESM)
import { BrowserWindow } from 'electron';

export default (dirname, route, title) => {
  /** @type {import('electron').BrowserWindow | undefined} */
  let win;

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
    };

    win = new BrowserWindow(options);

    const windowRoute = `serve://dist#/${route}`;
    win.loadURL(windowRoute);

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

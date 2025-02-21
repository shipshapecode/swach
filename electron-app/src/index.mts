import * as Sentry from '@sentry/electron';
import { Event, IpcMainEvent, ipcMain, nativeTheme } from 'electron';
import isDev from 'electron-is-dev';
import Store from 'electron-store';
import { Menubar, menubar } from 'menubar';
import { basename, dirname, join, resolve } from 'path';
import { pathToFileURL } from 'url';

import { setupUpdateServer } from './auto-update.mjs';
import { launchPicker } from './color-picker.mjs';
import { noUpdatesAvailableDialog } from './dialogs.mjs';
import { handleFileURLs } from './handle-file-urls.mjs';
import { setupEventHandlers } from './ipc-events.mjs';
import {
  registerKeyboardShortcuts,
  setupContextMenu,
  setupMenu,
} from './shortcuts.mjs';

const emberAppDir: string = resolve(__dirname, '..', 'ember-dist');

if (isDev) {
  const debug = (await import('electron-debug')).default;
  debug({ showDevTools: false });
}

const pkg = await import('../package.json', {
  assert: { type: 'json' },
});

Sentry.init({
  appName: 'swach',
  dsn: 'https://6974b46329f24dc1b9fca4507c65e942@sentry.io/3956140',
  release: `v${pkg.default.version}`,
});

interface StoreSchema {
  firstRunV1: boolean;
  showDockIcon: boolean;
}

const store = new Store<StoreSchema>({
  defaults: {
    firstRunV1: true,
    showDockIcon: false,
  },
});

let emberAppURL = pathToFileURL(join(emberAppDir, 'index.html')).toString();

// On first boot of the application, go through the welcome screen
if (store.get('firstRunV1')) {
  emberAppURL = `${emberAppURL}#/welcome`;
  store.set('firstRunV1', false);
}

function openContrastChecker(mb: Menubar): void {
  mb.showWindow();
  mb.window?.webContents.send('openContrastChecker');
}

let menubarIcon = 'resources/menubar-icons/iconTemplate.png';

if (process.platform === 'win32') {
  menubarIcon = 'resources/icon.ico';
}

if (process.platform === 'linux') {
  menubarIcon = 'resources/png/64x64.png';
}

const mb = menubar({
  index: false,
  browserWindow: {
    alwaysOnTop: false,
    height: 703,
    resizable: false,
    width: 362,
    webPreferences: {
      contextIsolation: false,
      devTools: isDev,
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
  },
  icon: join(__dirname || resolve(dirname('')), '..', menubarIcon),
  preloadWindow: true,
  showDockIcon: store.get('showDockIcon'),
  showOnAllWorkspaces: false,
});

mb.app.commandLine.appendSwitch(
  'disable-backgrounding-occluded-windows',
  'true',
);

mb.app.commandLine.appendSwitch('ignore-certificate-errors', 'true');

let sharedPaletteLink: string | undefined;

async function openSharedPalette(): Promise<void> {
  await mb.showWindow();

  if (sharedPaletteLink) {
    const query = sharedPaletteLink.split('?data=')[1];
    if (mb?.window && query) {
      mb.window.webContents.send('openSharedPalette', query);
    }
  }
}

if (isDev && process.platform === 'win32') {
  // Set the path of electron.exe and your app.
  // These two additional parameters are only available on windows.
  // Setting this is required to get this working in dev mode.
  mb.app.setAsDefaultProtocolClient('swach', process.execPath, [
    resolve(process.argv[1]),
  ]);
} else {
  mb.app.setAsDefaultProtocolClient('swach');
}

mb.app.on('open-url', function (event: Event, data: string) {
  event.preventDefault();
  sharedPaletteLink = data;
  openSharedPalette();
});

// Force single application instance
const gotTheLock = mb.app.requestSingleInstanceLock();

if (!gotTheLock) {
  mb.app.quit();
} else {
  mb.app.on('second-instance', (e: Event, argv: string[]) => {
    if (mb.window) {
      if (process.platform !== 'darwin') {
        sharedPaletteLink = argv.find((arg) => arg.startsWith('swach://'));
        openSharedPalette();
      }
    }
  });
}

if (process.platform === 'win32') {
  if ((await import('electron-squirrel-startup')).default) mb.app.exit();
}

// @ts-expect-error TODO: figure out this type issue
setupEventHandlers(mb, store);

mb.app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    mb.app.quit();
  }
});

mb.on('after-create-window', async () => {
  // Load the ember application using our custom protocol/scheme
  await handleFileURLs(emberAppDir);

  mb.window?.loadURL(emberAppURL);

  // If a loading operation goes wrong, we'll send Electron back to
  // Ember App entry point
  mb.window?.webContents.on('did-fail-load', () => {
    mb.window?.loadURL(emberAppURL);
  });

  mb.window?.once('ready-to-show', function () {
    setTimeout(() => {
      mb.showWindow();
    }, 750);
  });

  mb.window?.webContents.on('render-process-gone', () => {
    console.log(
      'Your Ember app (or other code) in the main window has crashed.',
    );
    console.log(
      'This is a serious issue that needs to be handled and/or debugged.',
    );
  });

  mb.window?.on('unresponsive', () => {
    console.log(
      'Your Ember app (or other code) has made the window unresponsive.',
    );
  });

  mb.window?.on('responsive', () => {
    console.log('The main window has become responsive again.');
  });

  registerKeyboardShortcuts(mb, launchPicker, openContrastChecker);

  setupMenu(mb, launchPicker, openContrastChecker);
  setupContextMenu(mb, launchPicker, openContrastChecker);
  const setOSTheme = () => {
    let theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    mb.window?.webContents.send('setTheme', theme);
  };

  nativeTheme.on('updated', setOSTheme);
});

mb.on('ready', async () => {
  ipcMain.on(
    'enableDisableAutoStart',
    (event: IpcMainEvent, openAtLogin: boolean) => {
      // We only want to allow auto-start if in production mode
      if (!isDev) {
        if (process.platform === 'darwin') {
          mb.app.setLoginItemSettings({
            openAtLogin,
          });
        }

        if (process.platform === 'win32') {
          const appFolder = dirname(process.execPath);
          const updateExe = resolve(appFolder, '..', 'Update.exe');
          const exeName = basename(process.execPath);

          mb.app.setLoginItemSettings({
            openAtLogin,
            path: updateExe,
            args: [
              '--processStart',
              `"${exeName}"`,
              '--process-start-args',
              `"--hidden"`,
            ],
          });
        }
      }
    },
  );
});

// We only want to auto update if we're on MacOS or Windows. Linux will use Snapcraft.
if (!isDev && (process.platform === 'darwin' || process.platform === 'win32')) {
  const autoUpdater = setupUpdateServer(mb.app);
  ipcMain.on('checkForUpdates', () => {
    autoUpdater.once('update-not-available', noUpdatesAvailableDialog);
    autoUpdater.checkForUpdates();
  });
}

// Handle an unhandled error in the main thread
process.on('uncaughtException', (err: Error) => {
  console.log('An exception in the main thread was not handled.');
  console.log(
    'This is a serious issue that needs to be handled and/or debugged.',
  );
  console.log(`Exception: ${err}`);
});

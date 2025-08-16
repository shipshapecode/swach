import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { init } from '@sentry/electron';
import { ipcMain, nativeTheme } from 'electron';
import isDev from 'electron-is-dev';
import Store from 'electron-store';
import { menubar } from 'menubar';
import pkg from '../package.json' with { type: 'json' };
import { setupUpdateServer } from './auto-update.js';
import { launchPicker } from './color-picker.js';
import { noUpdatesAvailableDialog } from './dialogs.js';
import handleFileUrls from './handle-file-urls.js';
import { setupEventHandlers } from './ipc-events.js';
import {
  registerKeyboardShortcuts,
  setupContextMenu,
  setupMenu,
} from './shortcuts.js';

// __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const emberAppDir = resolve(__dirname, '..', 'ember-dist');

if (isDev) {
  import('electron-debug')
    .then(({ default: debug }) => {
      debug({ showDevTools: false });
    })
    .catch(() => {});
}

init({
  appName: 'swach',
  dsn: 'https://6974b46329f24dc1b9fca4507c65e942@sentry.io/3956140',
  release: `v${pkg.version}`,
});

const store = new Store({
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

function openContrastChecker(mb) {
  mb.showWindow();
  mb.window.webContents.send('openContrastChecker');
}

let menubarIcon = 'resources/menubar-icons/iconTemplate.png';
if (process.platform === 'win32') menubarIcon = 'resources/icon.ico';
if (process.platform === 'linux') menubarIcon = 'resources/png/64x64.png';

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
  icon: join(__dirname, '..', menubarIcon),
  preloadWindow: true,
  showDockIcon: store.get('showDockIcon'),
  showOnAllWorkspaces: false,
});

mb.app.allowRendererProcessReuse = true;

mb.app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
mb.app.commandLine.appendSwitch(
  'disable-backgrounding-occluded-windows',
  'true'
);
mb.app.commandLine.appendSwitch('ignore-certificate-errors', true);

let sharedPaletteLink;

async function openSharedPalette() {
  await mb.showWindow();

  if (sharedPaletteLink) {
    const query = sharedPaletteLink.split('?data=')[1];
    if (mb?.window && query) {
      mb.window.webContents.send('openSharedPalette', query);
    }
  }
}

if (isDev && process.platform === 'win32') {
  // Windows dev mode protocol registration
  mb.app.setAsDefaultProtocolClient('swach', process.execPath, [
    resolve(process.argv[1]),
  ]);
} else {
  mb.app.setAsDefaultProtocolClient('swach');
}

mb.app.on('open-url', function (event, data) {
  event.preventDefault();
  sharedPaletteLink = data;
  openSharedPalette();
});

// Force single application instance
const gotTheLock = mb.app.requestSingleInstanceLock();

if (!gotTheLock) {
  mb.app.quit();
} else {
  mb.app.on('second-instance', (e, argv) => {
    if (mb.window) {
      if (process.platform !== 'darwin') {
        sharedPaletteLink = argv.find((arg) => arg.startsWith('swach://'));
        openSharedPalette();
      }
    }
  });
}

if (process.platform === 'win32') {
  import('electron-squirrel-startup')
    .then(({ default: handled }) => {
      if (handled) mb.app.exit();
    })
    .catch(() => {});
}

// const browsers = require('./browsers')(__dirname);
// const { settings } = browsers;
// const showPreferences = () => settings.init();
// ipcMain.on('showPreferences', showPreferences);

setupEventHandlers(mb, store);

// Uncomment to enable Electron's crash reporter
// electron.crashReporter.start({ ... });

mb.app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    mb.app.quit();
  }
});

mb.on('after-create-window', async () => {
  // Load the Ember application using our custom protocol/scheme
  await handleFileUrls(emberAppDir);

  mb.window.loadURL(emberAppURL);

  // If a loading operation goes wrong, we'll send Electron back to Ember entry
  mb.window.webContents.on('did-fail-load', () => {
    mb.window.loadURL(emberAppURL);
  });

  mb.window.once('ready-to-show', function () {
    setTimeout(() => {
      mb.showWindow();
    }, 750);
  });

  mb.window.webContents.on('render-process-gone', () => {
    console.log(
      'Your Ember app (or other code) in the main window has crashed.'
    );
    console.log(
      'This is a serious issue that needs to be handled and/or debugged.'
    );
  });

  mb.window.on('unresponsive', () => {
    console.log(
      'Your Ember app (or other code) has made the window unresponsive.'
    );
  });

  mb.window.on('responsive', () => {
    console.log('The main window has become responsive again.');
  });

  registerKeyboardShortcuts(mb, launchPicker, openContrastChecker);

  setupMenu(mb, launchPicker, openContrastChecker);
  setupContextMenu(mb, launchPicker, openContrastChecker);

  const setOSTheme = () => {
    const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    mb.window.webContents.send('setTheme', theme);
  };

  nativeTheme.on('updated', setOSTheme);
});

mb.on('ready', async () => {
  ipcMain.on('enableDisableAutoStart', (event, openAtLogin) => {
    // Only allow auto-start in production
    if (!isDev) {
      if (process.platform === 'darwin') {
        mb.app.setLoginItemSettings({ openAtLogin });
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
  });
});

// Auto update on macOS/Windows (Linux uses Snapcraft)
if (!isDev && (process.platform === 'darwin' || process.platform === 'win32')) {
  const autoUpdater = setupUpdateServer(mb.app);
  ipcMain.on('checkForUpdates', () => {
    autoUpdater.once('update-not-available', noUpdatesAvailableDialog);
    autoUpdater.checkForUpdates();
  });
}

// Handle an unhandled error in the main thread
process.on('uncaughtException', (err) => {
  console.log('An exception in the main thread was not handled.');
  console.log(
    'This is a serious issue that needs to be handled and/or debugged.'
  );
  console.log(`Exception: ${err}`);
});

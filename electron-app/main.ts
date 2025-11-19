import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
// This should cause a type error
import { fileURLToPath, pathToFileURL } from 'node:url';

import { init } from '@sentry/electron/main';
import { ipcMain, nativeTheme } from 'electron';
import isDev from 'electron-is-dev';
import Store from 'electron-store';
import { menubar, type Menubar } from 'menubar';

import pkg from '../package.json';
import { setupUpdateServer } from './src/auto-update.js';
import { noUpdatesAvailableDialog } from './src/dialogs.js';
import handleFileUrls from './src/handle-file-urls.js';
import { setupEventHandlers } from './src/ipc-events.js';
import {
  registerKeyboardShortcuts,
  setupContextMenu,
  setupMenu,
} from './src/shortcuts.js';

// __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

init({
  dsn: 'https://6974b46329f24dc1b9fca4507c65e942@o361681.ingest.us.sentry.io/3956140',
  release: `v${pkg.version}`,
});

const store = new Store({
  defaults: {
    firstRunV1: true,
    showDockIcon: false,
  },
});

const emberAppDir = resolve(__dirname, '..', 'renderer', 'main_window');
let emberAppURL = isDev
  ? 'http://localhost:4200'
  : pathToFileURL(join(emberAppDir, 'index.html')).toString();

// On first boot of the application, go through the welcome screen
if (store.get('firstRunV1')) {
  emberAppURL = `${emberAppURL}#/welcome`;
  store.set('firstRunV1', false);
}

function openContrastChecker(mb: Menubar) {
  void mb.showWindow();
  mb.window!.webContents.send('openContrastChecker');
}

let menubarIcon = 'menubar-icons/iconTemplate.png';
if (process.platform === 'win32') menubarIcon = 'icon.ico';
if (process.platform === 'linux') menubarIcon = 'png/64x64.png';

// Determine the correct icon path based on environment
let iconPath: string;
if (isDev) {
  // In development, use the source directory
  iconPath = join(__dirname, '../../electron-app/resources', menubarIcon);
} else {
  // In production, use the packaged resources directory
  iconPath = join(process.resourcesPath, 'resources', menubarIcon);
}

const mb = menubar({
  index: false,
  browserWindow: {
    alwaysOnTop: false,
    height: 703,
    resizable: false,
    width: 362,
    webPreferences: {
      contextIsolation: true,
      devTools: isDev,
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
    },
  },
  icon: iconPath,
  preloadWindow: true,
  showDockIcon: store.get('showDockIcon'),
  showOnAllWorkspaces: false,
});

// mb.app.allowRendererProcessReuse = true; // Deprecated property

mb.app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
mb.app.commandLine.appendSwitch(
  'disable-backgrounding-occluded-windows',
  'true'
);
mb.app.commandLine.appendSwitch('ignore-certificate-errors', 'true');

let sharedPaletteLink: string | undefined;

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
    resolve(process.argv[1]!),
  ]);
} else {
  mb.app.setAsDefaultProtocolClient('swach');
}

mb.app.on('open-url', function (event, data) {
  event.preventDefault();
  sharedPaletteLink = data;
  void openSharedPalette();
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
        void openSharedPalette();
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

mb.on('after-create-window', () => {
  // Load the Ember application using our custom protocol/scheme
  handleFileUrls(emberAppDir);

  void mb.window!.loadURL(emberAppURL);

  // If a loading operation goes wrong, we'll send Electron back to Ember entry
  mb.window!.webContents.on('did-fail-load', () => {
    void mb.window!.loadURL(emberAppURL);
  });

  mb.window!.once('ready-to-show', function () {
    setTimeout(() => {
      void mb.showWindow();
    }, 750);
  });

  mb.window!.webContents.on('render-process-gone', () => {
    console.log(
      'Your Ember app (or other code) in the main window has crashed.'
    );
    console.log(
      'This is a serious issue that needs to be handled and/or debugged.'
    );
  });

  mb.window!.on('unresponsive', () => {
    console.log(
      'Your Ember app (or other code) has made the window unresponsive.'
    );
  });

  mb.window!.on('responsive', () => {
    console.log('The main window has become responsive again.');
  });

  registerKeyboardShortcuts(mb, openContrastChecker);

  setupMenu(mb, openContrastChecker);
  setupContextMenu(mb, openContrastChecker);

  const setOSTheme = () => {
    const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    mb.window!.webContents.send('setTheme', theme);
  };

  nativeTheme.on('updated', setOSTheme);
});

mb.on('ready', () => {
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

      if (process.platform === 'linux') {
        const autostartDir = join(homedir(), '.config', 'autostart');
        const desktopFile = join(autostartDir, 'swach.desktop');

        if (openAtLogin) {
          // Create autostart directory if it doesn't exist
          if (!existsSync(autostartDir)) {
            mkdirSync(autostartDir, { recursive: true });
          }

          // Create .desktop file for autostart
          const desktopEntry = `[Desktop Entry]
Type=Application
Version=1.0
Name=Swach
Comment=A robust color management tool for the modern age.
Exec=${process.execPath} --hidden
Icon=swach
Terminal=false
StartupNotify=false
X-GNOME-Autostart-enabled=true
Hidden=false
`;

          writeFileSync(desktopFile, desktopEntry);
        } else {
          // Remove .desktop file to disable autostart
          if (existsSync(desktopFile)) {
            unlinkSync(desktopFile);
          }
        }
      }
    }
  });
});

// Auto update on macOS/Windows (Linux uses Snapcraft)
if (!isDev && (process.platform === 'darwin' || process.platform === 'win32')) {
  const autoUpdater = setupUpdateServer(mb.app);
  ipcMain.on('checkForUpdates', () => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
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

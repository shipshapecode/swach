const Sentry = require('@sentry/electron');
const { ipcMain, nativeTheme } = require('electron');
const isDev = require('electron-is-dev');
const Store = require('electron-store');
// eslint-disable-next-line no-redeclare
const { menubar } = require('menubar');
const { basename, dirname, join, resolve } = require('path');
const { pathToFileURL } = require('url');

const { setupUpdateServer } = require('./auto-update');
const { launchPicker } = require('./color-picker');
const { noUpdatesAvailableDialog } = require('./dialogs');
const handleFileUrls = require('./handle-file-urls');
const { setupEventHandlers } = require('./ipc-events');
const {
  registerKeyboardShortcuts,
  setupContextMenu,
  setupMenu,
} = require('./shortcuts');

const emberAppDir = resolve(__dirname, '..', 'ember-dist');

if (isDev) {
  const debug = require('electron-debug');
  debug({ showDevTools: false });
}

Sentry.init({
  appName: 'swach',
  dsn: 'https://6974b46329f24dc1b9fca4507c65e942@sentry.io/3956140',
  release: `v${require('../package').version}`,
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

mb.app.allowRendererProcessReuse = true;

mb.app.commandLine.appendSwitch(
  'disable-backgrounding-occluded-windows',
  'true',
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
  // Set the path of electron.exe and your app.
  // These two additional parameters are only available on windows.
  // Setting this is required to get this working in dev mode.
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
  if (require('electron-squirrel-startup')) mb.app.exit();
}

// const browsers = require('./browsers')(__dirname);
// const { settings } = browsers;

// const showPreferences = () => settings.init();
// ipcMain.on('showPreferences', showPreferences);

setupEventHandlers(mb, store);

// Uncomment the lines below to enable Electron's crash reporter
// For more information, see http://electron.atom.io/docs/api/crash-reporter/
// electron.crashReporter.start({
//     productName: 'YourName',
//     companyName: 'YourCompany',
//     submitURL: 'https://your-domain.com/url-to-submit',
//     autoSubmit: true
// });

mb.app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    mb.app.quit();
  }
});

mb.on('after-create-window', async () => {
  // If you want to open up dev tools programmatically, call
  // mb.window.openDevTools();

  // Load the ember application using our custom protocol/scheme
  await handleFileUrls(emberAppDir);

  mb.window.loadURL(emberAppURL);

  // If a loading operation goes wrong, we'll send Electron back to
  // Ember App entry point
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
      'Your Ember app (or other code) in the main window has crashed.',
    );
    console.log(
      'This is a serious issue that needs to be handled and/or debugged.',
    );
  });

  mb.window.on('unresponsive', () => {
    console.log(
      'Your Ember app (or other code) has made the window unresponsive.',
    );
  });

  mb.window.on('responsive', () => {
    console.log('The main window has become responsive again.');
  });

  registerKeyboardShortcuts(mb, launchPicker, openContrastChecker);

  setupMenu(mb, launchPicker, openContrastChecker);
  setupContextMenu(mb, launchPicker, openContrastChecker);
  const setOSTheme = () => {
    let theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    mb.window.webContents.send('setTheme', theme);
  };

  nativeTheme.on('updated', setOSTheme);
});

mb.on('ready', async () => {
  ipcMain.on('enableDisableAutoStart', (event, openAtLogin) => {
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
  });
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
//
// Note that 'uncaughtException' is a crude mechanism for exception handling intended to
// be used only as a last resort. The event should not be used as an equivalent to
// "On Error Resume Next". Unhandled exceptions inherently mean that an application is in
// an undefined state. Attempting to resume application code without properly recovering
// from the exception can cause additional unforeseen and unpredictable issues.
//
// Attempting to resume normally after an uncaught exception can be similar to pulling out
// of the power cord when upgrading a computer -- nine out of ten times nothing happens -
// but the 10th time, the system becomes corrupted.
//
// The correct use of 'uncaughtException' is to perform synchronous cleanup of allocated
// resources (e.g. file descriptors, handles, etc) before shutting down the process. It is
// not safe to resume normal operation after 'uncaughtException'.
process.on('uncaughtException', (err) => {
  console.log('An exception in the main thread was not handled.');
  console.log(
    'This is a serious issue that needs to be handled and/or debugged.',
  );
  console.log(`Exception: ${err}`);
});

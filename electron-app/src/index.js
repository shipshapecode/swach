const {
  app,
  clipboard,
  dialog,
  ipcMain,
  nativeTheme,
  protocol
} = require('electron');
const AutoLaunch = require('auto-launch');
const { dirname, join, resolve } = require('path');
const { pathToFileURL } = require('url');
const isDev = require('electron-is-dev');
const fs = require('fs');
const { download } = require('electron-dl');
const { menubar } = require('menubar');
const {
  default: installExtension,
  EMBER_INSPECTOR
} = require('electron-devtools-installer');
const handleFileUrls = require('./handle-file-urls');
const migrateData = require('./migrate-data');

const emberAppDir = resolve(__dirname, '..', 'ember-dist');
const { launchPicker } = require('./color-picker');
const { noUpdatesAvailableDialog, restartDialog } = require('./dialogs');
const {
  registerKeyboardShortcuts,
  setupContextMenu,
  setupMenu
} = require('./shortcuts');
const { setupUpdateServer } = require('./auto-update');

if (isDev) {
  const debug = require('electron-debug');
  debug({ showDevTools: false });
}

const Sentry = require('@sentry/electron');

Sentry.init({
  dsn: 'https://6974b46329f24dc1b9fca4507c65e942@sentry.io/3956140'
});

const Store = require('electron-store');
const store = new Store({
  defaults: {
    firstRun: true,
    needsMigration: true,
    showDockIcon: false
  }
});

if (store.get('needsMigration')) {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'serve',
      privileges: {
        secure: true,
        standard: true
      }
    }
  ]);
}

let emberAppURL = pathToFileURL(join(emberAppDir, 'index.html')).toString();

// On first boot of the application, go through the welcome screen
if (store.get('firstRun')) {
  emberAppURL = `${emberAppURL}#/welcome`;
  store.set('firstRun', false);
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
    height: 697,
    resizable: false,
    width: 360,
    webPreferences: {
      contextIsolation: false,
      devTools: isDev,
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: true
    }
  },
  icon: join(__dirname || resolve(dirname('')), '..', menubarIcon),
  preloadWindow: true,
  showDockIcon: store.get('showDockIcon')
});

mb.app.allowRendererProcessReuse = true;

mb.app.commandLine.appendSwitch(
  'disable-backgrounding-occluded-windows',
  'true'
);

if (process.platform === 'win32') {
  if (require('electron-squirrel-startup')) mb.app.exit();
}

// const browsers = require('./browsers')(__dirname);
// const { settings } = browsers;

// const showPreferences = () => settings.init();
// ipcMain.on('showPreferences', showPreferences);

ipcMain.on('copyColorToClipboard', (channel, color) => {
  clipboard.writeText(color);
});

ipcMain.on('exportData', async (channel, jsonString) => {
  const downloadPath = `${mb.app.getPath('temp')}/swach-data.json`;
  fs.writeFileSync(downloadPath, jsonString);
  await download(mb.window, `file://${downloadPath}`);
  fs.unlink(downloadPath, (err) => {
    if (err) throw err;
    console.log(`${downloadPath} was deleted`);
  });
});

ipcMain.handle('getAppVersion', async () => {
  return app.getVersion();
});

ipcMain.handle('importData', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile']
  });

  if (!canceled && filePaths.length) {
    return fs.readFileSync(filePaths[0], { encoding: 'utf8' });
  }
});

ipcMain.on('exitApp', () => mb.app.quit());

ipcMain.on('launchContrastBgPicker', () => {
  launchPicker(mb, 'contrastBg');
});

ipcMain.on('launchContrastFgPicker', () => {
  launchPicker(mb, 'contrastFg');
});

ipcMain.on('launchPicker', () => {
  launchPicker(mb);
});

ipcMain.handle('getStoreValue', (event, key) => {
  return store.get(key);
});

ipcMain.on('setShowDockIcon', (channel, showDockIcon) => {
  store.set('showDockIcon', showDockIcon);
  restartDialog();
});

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

mb.on('after-create-window', function () {
  setupMenu(mb, launchPicker, openContrastChecker);
  setupContextMenu(mb, launchPicker, openContrastChecker);
});

mb.on('ready', async () => {
  if (store.get('needsMigration')) {
    await migrateData();
    store.set('needsMigration', false);
  }

  // TODO: make theme setting invokable from the Ember side, to make sure first boot is correct.
  const setOSTheme = () => {
    let theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    mb.window.webContents.send('setTheme', theme);
  };

  nativeTheme.on('updated', setOSTheme);

  setOSTheme();

  if (isDev) {
    try {
      require('devtron').install();
    } catch (err) {
      console.log('Failed to install Devtrom: ', err);
    }
    try {
      await installExtension(EMBER_INSPECTOR);
    } catch (err) {
      console.log('Failed to install Ember Inspector: ', err);
    }
  }
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

  mb.window.webContents.on('crashed', () => {
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

  const autoLaunch = new AutoLaunch({
    name: 'Swach'
  });

  ipcMain.on('enableDisableAutoStart', (event, shouldEnable) => {
    // We only want to allow auto-start if in production mode
    if (!isDev) {
      autoLaunch.isEnabled().then((isEnabled) => {
        if (!isEnabled && shouldEnable) {
          autoLaunch.enable();
        } else if (isEnabled && !shouldEnable) {
          autoLaunch.disable();
        }
      });
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
    'This is a serious issue that needs to be handled and/or debugged.'
  );
  console.log(`Exception: ${err}`);
});

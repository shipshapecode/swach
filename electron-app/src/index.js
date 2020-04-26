const { clipboard, protocol, Menu, ipcMain } = require('electron');
const AutoLaunch = require('auto-launch');
const { dirname, join, resolve } = require('path');
const isDev = require('electron-is-dev');
const protocolServe = require('electron-protocol-serve');
const { menubar } = require('menubar');
const { launchPicker } = require('./color-picker');
const { restartDialog } = require('./dialogs');
const { registerKeyboardShortcuts } = require('./shortcuts');
const { setupUpdateServer } = require('./auto-update');

const debug = require('electron-debug');
debug({ showDevTools: false });

const Store = require('electron-store');
const store = new Store({
  defaults: {
    showDockIcon: false
  }
});

const emberAppLocation = 'serve://dist';

function openContrastChecker(mb) {
  mb.showWindow();
  mb.window.webContents.send('openContrastChecker');
}

const mb = menubar({
  index: false,
  browserWindow: {
    alwaysOnTop: false,
    height: 640,
    resizable: false,
    width: 360,
    webPreferences: {
      contextIsolation: false,
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: true
    }
  },
  icon: join(
    __dirname || resolve(dirname('')),
    '..',
    'resources/menubar-icons/iconTemplate.png'
  ),
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

ipcMain.on('requestStoreValue', (event, key) => {
  event.sender.send('replyStoreValue', key, store.get(key));
});

ipcMain.on('setShowDockIcon', (channel, showDockIcon) => {
  store.set('showDockIcon', showDockIcon);
  restartDialog();
});

// Registering a protocol & schema to serve our Ember application
if (typeof protocol.registerSchemesAsPrivileged === 'function') {
  // Available in Electron >= 5
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'serve',
      privileges: {
        secure: true,
        standard: true
      }
    }
  ]);
} else {
  // For compatibility with Electron < 5
  protocol.registerStandardSchemes(['serve'], { secure: true });
}
protocolServe({
  cwd: join(__dirname || resolve(dirname('')), '..', 'ember-dist'),
  app: mb.app,
  protocol
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

mb.app.on('activate', (event, hasVisibleWindows) => {
  if (!hasVisibleWindows) {
    mb.showWindow();
  }
});

mb.on('after-create-window', function () {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Color Picker',
      click() {
        launchPicker(mb);
      }
    },
    {
      label: 'Contrast Checker',
      click() {
        openContrastChecker(mb);
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click() {
        mb.app.quit();
      }
    }
  ]);

  mb.tray.on('right-click', () => {
    mb.tray.popUpContextMenu(contextMenu);
  });
});

mb.on('ready', () => {
  // If you want to open up dev tools programmatically, call
  // mb.window.openDevTools();

  // Load the ember application using our custom protocol/scheme
  mb.window.loadURL(emberAppLocation);

  // If a loading operation goes wrong, we'll send Electron back to
  // Ember App entry point
  mb.window.webContents.on('did-fail-load', () => {
    mb.window.loadURL(emberAppLocation);
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

if (!isDev) {
  const autoUpdater = setupUpdateServer(mb.app);
  ipcMain.on('checkForUpdates', () => {
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

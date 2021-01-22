const { globalShortcut, shell, Menu } = require('electron');

function registerKeyboardShortcuts(mb, launchPicker, openContrastChecker) {
  globalShortcut.register('Ctrl+Super+Alt+p', () => {
    launchPicker(mb);
  });

  globalShortcut.register('Ctrl+Super+Alt+c', () => {
    openContrastChecker(mb);
  });

  mb.app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}

function setupContextMenu(mb, launchPicker, openContrastChecker) {
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
}

function setupMenu(mb, launchPicker, openContrastChecker) {
  const isMac = process.platform === 'darwin';

  const template = [
    // { role: 'appMenu' }
    ...(isMac
      ? [
          {
            label: mb.app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'quit' }
            ]
          }
        ]
      : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
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
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          async click() {
            await mb.window.webContents.send('undoRedo', 'undo');
          }
        },
        {
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          async click() {
            await mb.window.webContents.send('undoRedo', 'redo');
          }
        },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
        { type: 'separator' },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          selector: 'selectAll:'
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'View Documentation',
          click: async () => {
            await shell.openExternal('https://swach.io/docs/');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

module.exports = {
  registerKeyboardShortcuts,
  setupContextMenu,
  setupMenu
};

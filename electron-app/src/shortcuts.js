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
      submenu: [{ role: 'undo' }, { role: 'redo' }]
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

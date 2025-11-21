import {
  globalShortcut,
  Menu,
  shell,
  type MenuItemConstructorOptions,
} from 'electron';
import { type Menubar } from 'menubar';

import { launchPicker } from './color-picker.js';

type OpenContrastCheckerFn = (mb: Menubar) => void;

export function registerKeyboardShortcuts(
  mb: Menubar,
  openContrastChecker: OpenContrastCheckerFn
) {
  globalShortcut.register('Ctrl+Super+Alt+p', () => {
    void launchPicker(mb);
  });

  globalShortcut.register('Ctrl+Super+Alt+c', () => {
    openContrastChecker(mb);
  });

  mb.app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}

export function setupContextMenu(
  mb: Menubar,
  openContrastChecker: OpenContrastCheckerFn
) {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Color Picker',
      click() {
        void launchPicker(mb);
      },
    },
    {
      label: 'Contrast Checker',
      click() {
        openContrastChecker(mb);
      },
    },
    { type: 'separator' },
    {
      label: 'Toggle DevTools',
      click() {
        mb.window?.webContents.toggleDevTools();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click() {
        mb.app.quit();
      },
    },
  ]);

  mb.tray.on('right-click', () => {
    mb.tray.popUpContextMenu(contextMenu);
  });
}

export function setupMenu(
  mb: Menubar,
  openContrastChecker: OpenContrastCheckerFn
) {
  const isMac = process.platform === 'darwin';

  const template = [
    // { role: 'appMenu' }
    ...(isMac
      ? [
          {
            label: mb.app.name,
            submenu: [
              { label: 'About Swach', role: 'about' },
              { type: 'separator' },
              { label: 'Quit Swach', role: 'quit' },
            ],
          },
        ]
      : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        {
          label: 'Color Picker',
          click() {
            void launchPicker(mb);
          },
        },
        {
          label: 'Contrast Checker',
          click() {
            openContrastChecker(mb);
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          click() {
            mb.window!.webContents.send('undoRedo', 'undo');
          },
        },
        {
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          click() {
            mb.window!.webContents.send('undoRedo', 'redo');
          },
        },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          selector: 'selectAll:',
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'View Documentation',
          click: async () => {
            await shell.openExternal('https://swach.io/docs/');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template as MenuItemConstructorOptions[]);
  Menu.setApplicationMenu(menu);
}

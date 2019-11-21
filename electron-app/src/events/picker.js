'use strict';

const { clipboard, ipcMain } = require('electron');
const robot = require('robotjs');

let mouseEvent, color;

module.exports = (mb, browsers) => {
  const { picker } = browsers;

  let closePicker = newColor => {
    if (typeof newColor !== 'string') newColor = color;
    if (picker.getWindow()) {
      picker.getWindow().close();
      mb.showWindow();
      clipboard.writeText(newColor);
      mb.window.webContents.send('changeColor', newColor);
      ipcMain.removeListener('closePicker', closePicker);
      ipcMain.removeListener('pickerRequested', () => {});
    }
  };

  ipcMain.on('pickerRequested', () => {
    if (process.platform === 'darwin') mouseEvent = require('osx-mouse')();
    // if (process.platform === 'linux') mouseEvent = require('linux-mouse')()
    if (process.platform === 'win32') mouseEvent = require('win-mouse')();

    picker.getWindow().on('close', () => mouseEvent.destroy());

    mouseEvent.on('move', (x, y) => {
      let color = '#' + robot.getPixelColor(parseInt(x), parseInt(y));
      picker.getWindow().setPosition(parseInt(x) - 50, parseInt(y) - 50);
      picker.getWindow().webContents.send('updatePicker', color);
    });

    mouseEvent.on('left-up', (x, y) => {
      closePicker('#' + robot.getPixelColor(parseInt(x), parseInt(y)));
    });

    let pos = robot.getMousePos();
    picker.getWindow().setPosition(parseInt(pos.x) - 50, parseInt(pos.y) - 50);
    picker.getWindow().webContents.send('updatePicker', robot.getPixelColor(pos.x, pos.y));

    ipcMain.on('closePicker', closePicker);
    mouseEvent.on('right-up', closePicker);
  });
};

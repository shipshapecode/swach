'use strict';

const { BrowserWindow } = require('electron');

module.exports = (dirname, route) => {
  let win;

  /**
   * [init]
   * @param {boolean} force [force launching new window]
   * @return {void} [new Colorpicker]
   */
  let init = () => {

    if (win === null || win === undefined) createWindow();
    else win.show();

    // win.openDevTools();
  };

  /**
   * [createWindow - create new Window]
   * @param  {int} width  [width of the window]
   * @param  {int} height [height of the window]
   * @return {void}
   */
  let createWindow = () => {
    let options = {
      width: 700,
      height: 500,
      minWidth: 460,
      minHeight: 340,
      fullscreenable: false
    };

    win = new BrowserWindow(options);
    const windowRoute = `serve://dist#/${route}`;
    win.loadURL(windowRoute);

    win.on('closed', () => {
      win = undefined;
    });
  };

  let getWindow = () => win;

  return {
    init: init,
    getWindow: getWindow
  };
};

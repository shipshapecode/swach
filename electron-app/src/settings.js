/**
 * Shows/hides the dock icon
 * @param {*} mb The menubar instance
 * @param {boolean} show
 */
function showHideDockIcon(mb, show) {
  if (process.platform === 'darwin') {
    if (show) {
      mb.app.dock.show();
    } else {
      mb.app.dock.hide();
    }
  }

  if (process.platform === 'win32') {
    mb.window.setSkipTaskbar(!show);
  }
}

module.exports = {
  showHideDockIcon
};

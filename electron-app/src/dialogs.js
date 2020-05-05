const { app, dialog } = require('electron');

function noUpdatesAvailableDialog() {
  const dialogOpts = {
    type: 'info',
    title: 'Already up to date',
    message: 'Already up to date',
    detail: `Swach ${app.getVersion()} is the latest version available.`
  };

  return dialog.showMessageBox(dialogOpts);
}

function restartDialog() {
  const dialogOpts = {
    type: 'question',
    buttons: ['Restart', 'Later'],
    title: 'Restart Required',
    message: 'Restart now?',
    detail: 'A restart is required to apply this setting. Restart now?',
    defaultId: 0
  };

  return dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) {
      app.relaunch();
      app.exit();
    }
  });
}

module.exports = {
  noUpdatesAvailableDialog,
  restartDialog
};

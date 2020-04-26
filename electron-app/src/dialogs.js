const { app, dialog } = require('electron');

function restartDialog() {
  const dialogOpts = {
    type: 'question',
    buttons: ['Restart', 'Later'],
    title: 'Restart Required',
    message: 'Restart now?',
    detail: 'A restart is required to apply this setting. Restart now?',
    defaultId: 0
  };

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) {
      app.relaunch();
      app.exit();
    }
  });
}

module.exports = {
  restartDialog
};

const { autoUpdater, dialog } = require('electron');

const setupUpdateServer = (app) => {
  const server = 'https://download.swach.io';
  const feed = `${server}/update/${process.platform}/${app.getVersion()}`;

  autoUpdater.setFeedURL(feed);

  // Checks for updates every 30 minutes
  const checkForUpdatesInterval = setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 30 * 60 * 1000);

  autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    clearInterval(checkForUpdatesInterval);
    autoUpdater.removeAllListeners('update-not-available');
    const dialogOpts = {
      type: 'question',
      buttons: ['Restart', 'Later'],
      title: 'Application Update',
      message: process.platform === 'win32' ? releaseNotes : releaseName,
      detail:
        'A new version has been downloaded. Restart the application to apply the updates.'
    };

    dialog.showMessageBox(dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.on('error', (message) => {
    autoUpdater.removeAllListeners('update-not-available');
    console.error('There was a problem updating the application');
    console.error(message);
  });

  return autoUpdater;
};

module.exports = {
  setupUpdateServer
};

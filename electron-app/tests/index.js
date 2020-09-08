const path = require('path');
const { app } = require('electron');
const handleFileUrls = require('../src/handle-file-urls');
const {
  setupTestem,
  openTestWindow
} = require('ember-electron/lib/test-support');

const emberAppDir = path.resolve(__dirname, '..', 'ember-test');

app.on('ready', async function onReady() {
  await handleFileUrls(emberAppDir);
  setupTestem();
  openTestWindow(emberAppDir);
});

app.on('window-all-closed', function onWindowAllClosed() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

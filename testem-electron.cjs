'use strict';

module.exports = {
  test_page: 'tests/index.html?hidepassed',
  cwd: 'dist',
  disable_watching: true,
  launchers: {
    Electron: {
      exe: process.execPath,
      args: [
        './node_modules/vite-plugin-testem-electron/dist/test-runner.js',
        '<testPage>',
        '<baseUrl>',
        '<id>',
      ],
      protocol: 'browser',
    },
  },
  launch_in_ci: ['Electron'],
  launch_in_dev: ['Electron'],
  browser_start_timeout: 120,
};

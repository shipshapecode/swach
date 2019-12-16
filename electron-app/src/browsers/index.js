'use strict';

module.exports = (dirname) => ({
  settings: require('./window')(dirname, 'settings', 'Settings')
});

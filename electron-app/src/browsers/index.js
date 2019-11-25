'use strict';

module.exports = (dirname) => ({
  contrast: require('./window')(dirname, 'contrast', 'Contrast Checker'),
  picker: require('./picker')(dirname),
  settings: require('./window')(dirname, 'settings', 'Settings')
});

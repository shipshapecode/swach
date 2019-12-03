'use strict';

module.exports = (dirname) => ({
  contrast: require('./window')(dirname, 'contrast', 'Contrast Checker'),
  settings: require('./window')(dirname, 'settings', 'Settings')
});

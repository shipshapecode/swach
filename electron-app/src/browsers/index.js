'use strict';

module.exports = (dirname) => ({
  contrast: require('./window')(dirname, 'contrast'),
  picker: require('./picker')(dirname),
  settings: require('./window')(dirname, 'settings')
});

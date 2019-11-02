'use strict';

module.exports = (dirname) => ({
  picker: require('./picker')(dirname),
  settings: require('./settings')(dirname)
});

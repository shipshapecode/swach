'use strict';

module.exports = (mb, browsers, eventEmitter) => ({
  picker: require('./picker')(mb, browsers, eventEmitter)
});

import windowFactory from './window.js';

export default (dirname) => ({
  settings: windowFactory(dirname, 'settings', 'Settings'),
});

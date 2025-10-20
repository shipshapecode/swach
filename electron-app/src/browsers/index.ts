import windowFactory from './window.js';

export default (dirname: string) => ({
  settings: windowFactory(dirname, 'settings', 'Settings'),
});

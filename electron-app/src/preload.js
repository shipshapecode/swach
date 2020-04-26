const { remote } = require('electron');
const Sentry = require('@sentry/electron');

Sentry.init({
  dsn: 'https://6974b46329f24dc1b9fca4507c65e942@sentry.io/3956140'
});

if (process.platform === 'darwin') {
  const { nativeTheme, systemPreferences } = remote;

  const setOSTheme = () => {
    let theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    remote.getCurrentWindow().send('setTheme', theme);
  };

  systemPreferences.subscribeNotification(
    'AppleInterfaceThemeChangedNotification',
    setOSTheme
  );

  setOSTheme();
}

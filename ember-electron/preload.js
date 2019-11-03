const { remote } = require('electron');

if (process.platform === 'darwin') {
  const { systemPreferences } = remote;

  const setOSTheme = () => {
    let theme = systemPreferences.isDarkMode() ? 'dark' : 'light';
    remote.getCurrentWindow().send('setTheme', theme);
  };

  systemPreferences.subscribeNotification(
    'AppleInterfaceThemeChangedNotification',
    setOSTheme
  );

  setOSTheme();
}

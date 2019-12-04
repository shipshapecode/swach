const { remote } = require('electron');

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

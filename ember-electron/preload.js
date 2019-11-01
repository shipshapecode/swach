const { remote } = require('electron');

if (process.platform === 'darwin') {
  const { systemPreferences } = remote;
  const setOSTheme = () => {
    let theme = systemPreferences.isDarkMode() ? 'dark' : 'light';
    window.localStorage.os_theme = theme;

    //
    // Defined in index.html, so undefined when launching the app.
    // Will be defined for `systemPreferences.subscribeNotification` callback.
    //
    if ('__setTheme' in window) {
      window.__setTheme();
    }
  };

  systemPreferences.subscribeNotification(
    'AppleInterfaceThemeChangedNotification',
    setOSTheme
  );

  setOSTheme();
}

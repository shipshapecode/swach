import StorageObject from 'ember-local-storage/local/object';

export type themes = 'dynamic' | 'light' | 'dark';

export type SettingsStorage = {
  notifications: boolean;
  osTheme?: themes;
  openOnStartup: boolean;
  showDockIcon: boolean;
  sounds: boolean;
  userTheme: themes;
};

const Storage = StorageObject.extend();

Storage.reopenClass({
  initialState(): SettingsStorage {
    return {
      notifications: true,
      openOnStartup: false,
      showDockIcon: false,
      sounds: true,
      userTheme: 'dynamic'
    };
  }
});

export default Storage;

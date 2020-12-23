import StorageObject from 'ember-local-storage/local/object';

export type themes = 'dynamic' | 'light' | 'dark';

interface SettingsValues {
  notifications: boolean;
  osTheme?: themes;
  openOnStartup: boolean;
  showDockIcon: boolean;
  sounds: boolean;
  userTheme: themes;
}

export interface SettingsStorage extends SettingsValues, StorageObject {}

const Storage = StorageObject.extend();

Storage.reopenClass({
  initialState(): SettingsValues {
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

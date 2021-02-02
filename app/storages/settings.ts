import StorageObject from 'ember-local-storage/local/object';

export type themes = 'dynamic' | 'light' | 'dark';

interface SettingsValues {
  defaultColorFormat: 'hex' | 'hsl' | 'rgba';
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
      defaultColorFormat: 'hex',
      notifications: true,
      openOnStartup: false,
      showDockIcon: false,
      sounds: true,
      userTheme: 'dynamic'
    };
  }
});

export default Storage;

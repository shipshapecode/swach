import StorageObject from 'ember-local-storage/local/object';

export type colorFormats = 'hex' | 'hsl' | 'rgba';
export type themes = 'dynamic' | 'light' | 'dark';

interface SettingsValues {
  defaultColorFormat: colorFormats;
  notifications: boolean;
  osTheme?: themes;
  openOnStartup: boolean;
  showDockIcon: boolean;
  sounds: boolean;
  userHasLoggedInBefore: boolean;
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
      userHasLoggedInBefore: false,
      userTheme: 'dynamic',
    };
  },
});

export default Storage;

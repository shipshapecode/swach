import StorageObject from 'ember-local-storage/local/object';

const Storage = StorageObject.extend();

Storage.reopenClass({
  initialState() {
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

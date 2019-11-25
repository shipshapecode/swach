import StorageObject from 'ember-local-storage/local/object';

const Storage = StorageObject.extend();

Storage.reopenClass({
  initialState() {
    return {
      openOnStartup: false,
      sounds: true,
      userTheme: 'dynamic'
    };
  }
});

export default Storage;

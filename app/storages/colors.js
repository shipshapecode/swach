import StorageArray from 'ember-local-storage/local/array';

const Storage = StorageArray.extend();

Storage.reopenClass({
  initialState() {
    return [
      {
        name: 'Black',
        hex: '#000000'
      },
      {
        name: 'White',
        hex: '#FFFFFF'
      },
    ];
  }
});

export default Storage;

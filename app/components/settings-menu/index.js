import Component from '@glimmer/component';
import { action, set } from '@ember/object';
import { storageFor } from 'ember-local-storage';

const IDBExportImport = require('indexeddb-export-import');

export default class SettingsMenu extends Component {
  @storageFor('settings') settings;

  themes = ['dynamic', 'light', 'dark'];

  constructor() {
    super(...arguments);

    if (typeof requireNode !== 'undefined') {
      let { ipcRenderer } = requireNode('electron');
      this.ipcRenderer = ipcRenderer;
    }
  }

  get version() {
    if (typeof requireNode !== 'undefined') {
      return requireNode('electron').remote.app.getVersion();
    }

    return 'Version not available';
  }

  @action
  changeTheme(theme) {
    set(this, 'settings.userTheme', theme);
  }

  @action
  exportIndexedDB() {
    const DBOpenRequest = window.indexedDB.open('orbit', 1);
    DBOpenRequest.onsuccess = () => {
      const idbDatabase = DBOpenRequest.result;

      IDBExportImport.exportToJsonString(idbDatabase, (err, jsonString) => {
        if (err) {
          console.error(err);
        } else {
          if (this.ipcRenderer) {
            this.ipcRenderer.send('exportData', jsonString);
          }
        }
      });
    };
  }

  @action
  importIndexedDB() {
    // TODO open file chooser in Electron, clear all current data and pass json to IDBExportImport
  }

  @action
  visitWebsite(event) {
    event.preventDefault();
    if (typeof requireNode !== 'undefined') {
      requireNode('electron').shell.openExternal('https://swach.io/');
    }
  }
}

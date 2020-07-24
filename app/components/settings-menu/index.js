import Component from '@glimmer/component';
import { action, set } from '@ember/object';
import { inject as service } from '@ember/service';
import { storageFor } from 'ember-local-storage';
import IDBExportImport from 'indexeddb-export-import';

export default class SettingsMenu extends Component {
  @service dataCoordinator;
  @service store;
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
            idbDatabase.close();
          }
        }
      });
    };
  }

  @action
  importIndexedDB() {
    if (this.ipcRenderer) {
      this.ipcRenderer.invoke('importData').then((jsonString) => {
        if (jsonString) {
          const DBOpenRequest = window.indexedDB.open('orbit', 1);
          DBOpenRequest.onsuccess = () => {
            const idbDatabase = DBOpenRequest.result;
            IDBExportImport.clearDatabase(idbDatabase, (err) => {
              if (!err) {
                // cleared data successfully
                IDBExportImport.importFromJsonString(
                  idbDatabase,
                  jsonString,
                  async (err) => {
                    if (!err) {
                      idbDatabase.close();
                      // TODO is pulling from the backup with orbit the best "refresh" here?
                      const backup = this.dataCoordinator.getSource('backup');

                      if (backup) {
                        const transform = await backup.pull((q) =>
                          q.findRecords()
                        );
                        await this.store.sync(transform);
                      }
                    }
                  }
                );
              }
            });
          };
        }
      });
    }
  }

  @action
  visitWebsite(event) {
    event.preventDefault();
    if (typeof requireNode !== 'undefined') {
      requireNode('electron').shell.openExternal('https://swach.io/');
    }
  }
}

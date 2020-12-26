import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import IDBExportImport from 'indexeddb-export-import';

export default class SettingsData extends Component {
  @service dataCoordinator;
  @service store;

  @tracked isExporting = false;
  @tracked isImporting = false;

  @action
  exportIndexedDB() {
    if (this.ipcRenderer) {
      this.isExporting = true;
      const DBOpenRequest = window.indexedDB.open('orbit', 1);
      DBOpenRequest.onsuccess = () => {
        const idbDatabase = DBOpenRequest.result;

        IDBExportImport.exportToJsonString(idbDatabase, (err, jsonString) => {
          if (err) {
            this.isExporting = false;
            console.error(err);
          } else {
            this.ipcRenderer.send('exportData', jsonString);
            idbDatabase.close();
            this.isExporting = false;
          }
        });
      };
    }
  }

  @action
  importIndexedDB() {
    if (this.ipcRenderer) {
      this.isImporting = true;
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

                    this.isImporting = false;
                  }
                );
              }
            });
          };
        } else {
          this.isImporting = false;
        }
      });
    }
  }
}

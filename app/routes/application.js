import Route from '@ember/routing/route';
import { set } from '@ember/object';
import { inject as service } from '@ember/service';
import ENV from 'swach/config/environment';
import IDBExportImport from 'indexeddb-export-import';

export default class ApplicationRoute extends Route {
  @service dataCoordinator;
  @service router;

  needsMigration = false;

  constructor() {
    super(...arguments);

    if (typeof requireNode !== 'undefined') {
      let { ipcRenderer } = requireNode('electron');
      this.ipcRenderer = ipcRenderer;

      this.ipcRenderer
        .invoke('getStoreValue', 'needsMigration')
        .then((needsMigration) => {
          set(this, 'needsMigration', needsMigration);
        });

      this.router.on('routeDidChange', () => {
        this.ipcRenderer.send('setTouchbar', []);
      });
    }
  }

  async beforeModel() {
    if (ENV.environment === 'test') {
      this.dataCoordinator.removeStrategy('store-backup-sync');
      this.dataCoordinator.removeSource('backup');
    } else {
      const backup = this.dataCoordinator.getSource('backup');

      if (backup) {
        const transform = await backup.pull((q) => q.findRecords());
        await this.store.sync(transform);
      }
    }

    await this.dataCoordinator.activate();

    const palettes = await this.store.find('palette');
    let colorHistory = palettes.findBy('isColorHistory', true);

    if (!colorHistory) {
      colorHistory = await this.store.addRecord({
        type: 'palette',
        createdAt: new Date(),
        colorOrder: [],
        isColorHistory: true,
        isFavorite: false,
        isLocked: false
      });
    }
  }

  async activate() {
    await super.activate(...arguments);
    await this._restoreDataBackup();
  }

  async _restoreDataBackup() {
    if (this.ipcRenderer && this.needsMigration) {
      await this.ipcRenderer.invoke('getBackupData').then((jsonString) => {
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
                      this.ipcRenderer.send('reload');
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
}

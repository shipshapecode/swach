import type Owner from '@ember/owner';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import type FlashMessageService from 'ember-cli-flash/services/flash-messages';
import { storageFor } from 'ember-local-storage';
import type { Store } from 'ember-orbit';

import type { Coordinator } from '@orbit/coordinator';
import type IndexedDBSource from '@orbit/indexeddb';
import type { InitializedRecord } from '@orbit/records';
import type { IpcRenderer } from 'electron';
import IDBExportImport from 'indexeddb-export-import';

import type { SettingsStorage } from 'swach/storages/settings';
import { getDBOpenRequest } from 'swach/utils/get-db-open-request';

export default class SettingsData extends Component {
  @service declare dataCoordinator: Coordinator;
  @service flashMessages!: FlashMessageService;
  @service declare store: Store;

  @storageFor('settings') settings!: SettingsStorage;

  declare ipcRenderer: IpcRenderer;

  colorFormats = ['hex', 'hsl', 'rgba'];
  @tracked isExporting = false;
  @tracked isImporting = false;

  constructor(owner: Owner, args: Record<string, unknown>) {
    super(owner, args);

    if (typeof requireNode !== 'undefined') {
      const { ipcRenderer } = requireNode('electron');

      this.ipcRenderer = ipcRenderer;
    }
  }

  exportIndexedDB = () => {
    if (this.ipcRenderer) {
      this.isExporting = true;

      const DBOpenRequest = getDBOpenRequest();

      DBOpenRequest.onsuccess = () => {
        const idbDatabase = DBOpenRequest.result;

        IDBExportImport.exportToJsonString(
          idbDatabase,
          (err: Event | null, jsonString: string) => {
            if (err) {
              this.flashMessages.danger('An error occurred.');

              console.error(err);
            } else {
              this.ipcRenderer.send('exportData', jsonString);
              this.flashMessages.success(
                'Export saved to downloads directory.',
              );
            }

            idbDatabase.close();
            this.isExporting = false;
          },
        );
      };
    }
  };

  importIndexedDB = async () => {
    if (this.ipcRenderer) {
      this.isImporting = true;
      const jsonString = await this.ipcRenderer.invoke('importData') as string;

      if (jsonString) {
        const DBOpenRequest = getDBOpenRequest();

        DBOpenRequest.onsuccess = () => {
          const idbDatabase = DBOpenRequest.result;

          IDBExportImport.clearDatabase(idbDatabase, (err: Event | null) => {
            if (!err) {
              // cleared data successfully
              IDBExportImport.importFromJsonString(
                idbDatabase,
                jsonString,
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                async (err: Event | null) => {
                  if (!err) {
                    idbDatabase.close();

                    // TODO is pulling from the backup with orbit the best "refresh" here?
                    const backup =
                      this.dataCoordinator.getSource<IndexedDBSource>('backup');

                    if (backup) {
                      const records = await backup.query<InitializedRecord[]>(
                        (q) => q.findRecords(),
                      );

                      await this.store.sync((t) =>
                        records.map((r) => {
                          if (r?.attributes?.['hex']) {
                            delete r.attributes['hex'];
                          }

                          // We have to make sure these are all Date objects
                          // otherwise orbit will throw a validation error
                          if (r?.attributes?.['createdAt']) {
                            r.attributes['createdAt'] = new Date(
                              r.attributes['createdAt'] as string,
                            );
                          }

                          return t.addRecord(r);
                        }),
                      );
                      this.flashMessages.success('Data successfully replaced.');
                    }
                  }

                  this.isImporting = false;
                },
              );
            }
          });
        };
      } else {
        this.isImporting = false;
      }
    }
  };
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    SettingsData: typeof SettingsData;
  }
}

import { action } from '@ember/object';
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

  constructor(owner: unknown, args: Record<string, unknown>) {
    super(owner, args);

    if (typeof requireNode !== 'undefined') {
      const { ipcRenderer } = requireNode('electron');

      this.ipcRenderer = ipcRenderer;
    }
  }

  @action
  exportIndexedDB(): void {
    if (this.ipcRenderer) {
      this.isExporting = true;

      const DBOpenRequest = getDBOpenRequest();

      DBOpenRequest.onsuccess = () => {
        const idbDatabase = DBOpenRequest.result;

        IDBExportImport.exportToJsonString(
          idbDatabase,
          (err: Event, jsonString: string) => {
            if (err) {
              this.flashMessages.danger('An error occurred.');
              // eslint-disable-next-line no-console
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
  }

  @action
  importIndexedDB(): void {
    if (this.ipcRenderer) {
      this.isImporting = true;
      this.ipcRenderer.invoke('importData').then((jsonString: string) => {
        if (jsonString) {
          const DBOpenRequest = getDBOpenRequest();

          DBOpenRequest.onsuccess = () => {
            const idbDatabase = DBOpenRequest.result;

            IDBExportImport.clearDatabase(idbDatabase, (err: Event) => {
              if (!err) {
                // cleared data successfully
                IDBExportImport.importFromJsonString(
                  idbDatabase,
                  jsonString,
                  async (err: Event) => {
                    if (!err) {
                      idbDatabase.close();

                      // TODO is pulling from the backup with orbit the best "refresh" here?
                      const backup =
                        this.dataCoordinator.getSource<IndexedDBSource>(
                          'backup',
                        );

                      if (backup) {
                        const records = await backup.query<InitializedRecord[]>(
                          (q) => q.findRecords(),
                        );

                        await this.store.sync((t) =>
                          records.map((r) => {
                            if (r?.attributes?.hex) {
                              delete r.attributes.hex;
                            }

                            return t.addRecord(r);
                          }),
                        );
                        this.flashMessages.success(
                          'Data successfully replaced.',
                        );
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
      });
    }
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    SettingsData: typeof SettingsData;
  }
}

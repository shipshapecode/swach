import { on } from '@ember/modifier';
import type Owner from '@ember/owner';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import type FlashMessageService from 'ember-cli-flash/services/flash-messages';
import { storageFor } from 'ember-local-storage';
import { orbit, type Store } from 'ember-orbit';
import set from 'ember-set-helper/helpers/set';
import svgJar from 'ember-svg-jar/helpers/svg-jar';
import type { Coordinator } from '@orbit/coordinator';
import type IndexedDBSource from '@orbit/indexeddb';
import type { InitializedRecord } from '@orbit/records';
import type { IpcRenderer } from 'electron';
import IDBExportImport from 'indexeddb-export-import';
import LoadingButton from './loading-button.gts';
import OptionsMenu from './options-menu.gts';
import type { SettingsStorage } from 'swach/storages/settings';
import { getDBOpenRequest } from 'swach/utils/get-db-open-request';

export default class SettingsData extends Component {
  <template>
    <div class="p-4 h-full">
      <h6 class="font-semibold mb-2 text-heading text-sm">
        Formats
      </h6>

      <p class="text-sm">
        This determines the default color format that gets copied to the
        clipboard.
      </p>

      <OptionsMenu
        data-test-settings-format-dropdown
        class="my-4 w-full"
        @optionsClasses="divide-y divide-alt !p-0 w-full"
        @triggerClasses="bg-menu font-medium inline-flex justify-between px-4 py-2 rounded-md text-sm text-menu-text w-full focus:outline-none"
      >
        <:trigger>
          {{this.settings.defaultColorFormat}}

          <div class="bg-btn-bg-secondary p-1 rounded-full">
            {{svgJar "chevron-left" class="h-3 w-3 -rotate-90"}}
          </div>
        </:trigger>
        <:content>
          {{#each this.colorFormats as |format|}}
            <button
              data-test-format-option={{format}}
              class="px-4 py-2 text-left text-sm transition-colors w-full hover:text-menu-text-hover"
              type="button"
              {{on "click" (set this.settings "defaultColorFormat" format)}}
            >
              {{format}}
            </button>
          {{/each}}
        </:content>
      </OptionsMenu>

      <div class="mb-16">
        <h6 class="font-semibold mb-2 mt-4 text-heading text-sm">
          Data management
        </h6>

        <LoadingButton
          data-test-export-swatches-button
          class="mb-2"
          @loading={{this.isExporting}}
          @onClick={{this.exportIndexedDB}}
        >
          Backup swatches
        </LoadingButton>

        <LoadingButton
          data-test-import-swatches-button
          @loading={{this.isImporting}}
          @onClick={{this.importIndexedDB}}
        >
          Restore from backup
        </LoadingButton>
      </div>
    </div>
  </template>

  @orbit declare dataCoordinator: Coordinator;
  @orbit declare store: Store;

  @service flashMessages!: FlashMessageService;

  @storageFor('settings') settings!: SettingsStorage;

  declare ipcRenderer: IpcRenderer;

  colorFormats = ['hex', 'hsl', 'rgba'] as const;
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
                'Export saved to downloads directory.'
              );
            }

            idbDatabase.close();
            this.isExporting = false;
          }
        );
      };
    }
  };

  importIndexedDB = async () => {
    if (this.ipcRenderer) {
      this.isImporting = true;
      const jsonString = (await this.ipcRenderer.invoke(
        'importData'
      )) as string;

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

                async (err: Event | null) => {
                  if (!err) {
                    idbDatabase.close();

                    // TODO is pulling from the backup with orbit the best "refresh" here?
                    const backup =
                      this.dataCoordinator.getSource<IndexedDBSource>('backup');

                    if (backup) {
                      const records = await backup.query<InitializedRecord[]>(
                        (q) => q.findRecords()
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
                              r.attributes['createdAt'] as string
                            );
                          }

                          return t.addRecord(r);
                        })
                      );
                      this.flashMessages.success('Data successfully replaced.');
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
    }
  };
}

import Route from '@ember/routing/route';
import Router from '@ember/routing/router-service';
import { inject as service } from '@ember/service';

import { Store } from 'ember-orbit';

import { Coordinator } from '@orbit/coordinator';
import IndexedDBSource from '@orbit/indexeddb';
import { RecordSchema } from '@orbit/records';
import { IpcRenderer } from 'electron';

import ENV from 'swach/config/environment';
import PaletteModel from 'swach/data-models/palette';

export default class ApplicationRoute extends Route {
  @service dataCoordinator!: Coordinator;
  @service dataSchema!: RecordSchema;
  @service router!: Router;
  @service store!: Store;

  ipcRenderer!: IpcRenderer;

  constructor() {
    super(...arguments);

    if (typeof requireNode !== 'undefined') {
      const { ipcRenderer } = requireNode('electron');
      this.ipcRenderer = ipcRenderer;

      this.router.on('routeDidChange', () => {
        this.ipcRenderer.send('setTouchbar', []);
      });
    }
  }

  async beforeModel(): Promise<void> {
    if (ENV.environment === 'test') {
      this.dataCoordinator.removeStrategy('remote-store-sync');
      this.dataCoordinator.removeStrategy('store-beforequery-remote-query');
      this.dataCoordinator.removeStrategy('store-beforeupdate-remote-update');
      this.dataCoordinator.removeSource('remote');
      this.dataCoordinator.removeStrategy('store-backup-sync');
      this.dataCoordinator.removeSource('backup');
    } else {
      const backup = this.dataCoordinator.getSource(
        'backup'
      ) as IndexedDBSource;

      if (backup) {
        const transform = await backup.pull((q) => q.findRecords());

        // If a data migration has been loaded that requires the recreation of
        // inverse relationships, this flag will be set as part of the
        // migration. In order to recreate the inverse relationships, the data
        // will simply be reloaded into the backup db.
        // TODO: This is a bit of a hack that should be replaced with better
        // support for migrations in `IndexedDBCache` in `@orbit/indexeddb`.
        // @ts-expect-error This is a hacked property until we have a real one to use in ember-orbit
        if (backup.recreateInverseRelationshipsOnLoad) {
          // @ts-expect-error This is a hacked property until we have a real one to use in ember-orbit
          backup.recreateInverseRelationshipsOnLoad = false;
          await backup.sync(transform);
        }

        await this.store.sync(transform);
      }

      await this.dataCoordinator.activate();
    }

    const palettes = (await this.store.query((q) => q.findRecords('palette'), {
      sources: {
        remote: {
          include: ['colors']
        }
      }
    })) as PaletteModel[];

    let colorHistory = palettes.find(
      (palette: PaletteModel) => palette.isColorHistory
    );

    if (!colorHistory) {
      colorHistory = (await this.store.addRecord({
        type: 'palette',
        createdAt: new Date(),
        colorOrder: [],
        isColorHistory: true,
        isFavorite: false,
        isLocked: false,
        selectedColorIndex: 0
      })) as PaletteModel;
    }
  }
}

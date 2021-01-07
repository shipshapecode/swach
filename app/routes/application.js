import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

import { clone } from '@orbit/utils';

import ENV from 'swach/config/environment';

export default class ApplicationRoute extends Route {
  @service dataCoordinator;
  @service dataSchema;
  @service router;
  @service store;

  constructor() {
    super(...arguments);

    if (typeof requireNode !== 'undefined') {
      let { ipcRenderer } = requireNode('electron');
      this.ipcRenderer = ipcRenderer;

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
        console.log(transform);

        // If a data migration has been loaded that requires the recreation of
        // inverse relationships, this flag will be set as part of the
        // migration. In order to recreate the inverse relationships, the data
        // will simply be reloaded into the backup db.
        // TODO: This is a bit of a hack that should be replaced with better
        // support for migrations in `IndexedDBCache` in `@orbit/indexeddb`.
        if (backup.recreateInverseRelationshipsOnLoad) {
          backup.recreateInverseRelationshipsOnLoad = false;
          await backup.sync(transform);
        }

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
}

import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import ENV from 'swach/config/environment';

export default class ApplicationRoute extends Route {
  @service dataCoordinator;

  constructor() {
    super(...arguments);

    if (typeof requireNode !== 'undefined') {
      let { ipcRenderer } = requireNode('electron');
      this.ipcRenderer = ipcRenderer;
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

  async afterModel() {
    // TODO: remove this migration code when we are sure everyone has migrated.
    if (this.ipcRenderer) {
      await this.ipcRenderer.invoke('migrateData');
    }
  }
}

import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import ENV from 'swach/config/environment';

export default class ApplicationRoute extends Route {
  @service dataCoordinator;

  async beforeModel() {
    if (ENV.environment === 'test') {
      this.dataCoordinator.removeStrategy('store-backup-sync');
      this.dataCoordinator.removeSource('backup');
      const mirage = this.dataCoordinator.getSource('mirage');

      if (mirage) {
        const transform = await mirage.pull(q => q.findRecords('color'));
        const transform2 = await mirage.pull(q => q.findRecords('palette'));
        await this.store.sync(transform);
        await this.store.sync(transform2);
      }
    } else {
      this.dataCoordinator.removeStrategy('mirage-store-sync');
      this.dataCoordinator.removeStrategy('store-beforequery-mirage-query');
      this.dataCoordinator.removeStrategy('store-beforeupdate-mirage-update');
      this.dataCoordinator.removeSource('mirage');

      const backup = this.dataCoordinator.getSource('backup');

      if (backup) {
        const transform = await backup.pull(q => q.findRecords());
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
        isColorHistory: true,
        isFavorite: false,
        isLocked: false
      });
    }
  }
}

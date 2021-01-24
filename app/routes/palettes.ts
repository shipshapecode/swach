import Controller from '@ember/controller';
import Transition from '@ember/routing/-private/transition';
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

import { LiveQuery, Store } from 'ember-orbit';

export default class PalettesRoute extends Route {
  @service store!: Store;

  async model(): Promise<LiveQuery> {
    const palettes = await this.store.cache.liveQuery((qb) =>
      qb
        .findRecords('palette')
        .filter({ attribute: 'isColorHistory', value: false })
        .sort('index')
    );
    const colorHistory = await this.store.cache.liveQuery((qb) =>
      qb
        .findRecords('palette')
        .filter({ attribute: 'isColorHistory', value: true })
    );

    return {
      palettes,
      colorHistory
    };
  }

  resetController(
    controller: Controller,
    isExiting: boolean,
    transition: Transition<any>
  ): void {
    super.resetController(controller, isExiting, transition);
    if (isExiting) {
      controller.colorHistoryMenuIsShown = false;
    }
  }
}

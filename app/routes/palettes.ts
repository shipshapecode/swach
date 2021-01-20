import Controller from '@ember/controller';
import Route from '@ember/routing/route';
import Transition from '@ember/routing/-private/transition';
import { inject as service } from '@ember/service';

import { LiveQuery, Store } from 'ember-orbit';

export default class PalettesRoute extends Route {
  @service store!: Store;

  async model(): Promise<LiveQuery> {
    return this.store.cache.liveQuery((qb) => qb.findRecords('palette'));
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

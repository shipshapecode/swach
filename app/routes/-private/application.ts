import { getOwner } from '@ember/owner';
import Route from '@ember/routing/route';
import type Router from '@ember/routing/router-service';
import { service } from '@ember/service';
import { setupOrbit } from 'ember-orbit';
import { isTesting } from '@embroider/macros';
import type DataService from 'swach/services/data';
import type Session from 'swach/services/session';

const dataModels = import.meta.glob('../../data-models/*.{js,ts}', {
  eager: true,
});
const dataSources = import.meta.glob('../../data-sources/*.{js,ts}', {
  eager: true,
});
const dataStrategies = import.meta.glob('../../data-strategies/*.{js,ts}', {
  eager: true,
});

export default class ApplicationRoute extends Route {
  @service declare data: DataService;
  @service declare router: Router;
  @service declare session: Session;

  async beforeModel(): Promise<void> {
    if (!isTesting()) {
      const owner = getOwner(this);

      setupOrbit(owner!, {
        ...dataModels,
        ...dataSources,
        ...dataStrategies,
      });
    }

    await this.session.setup();

    await this.data.activate();
    await this.data.synchronize();
  }
}

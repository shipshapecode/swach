import Route from '@ember/routing/route';
import type Transition from '@ember/routing/transition';
import { service } from '@ember/service';
import { storageFor } from 'ember-local-storage';
import type { Store } from '@ef4/ember-orbit';
import type ColorModel from 'swach/data-models/color';
import type Session from 'swach/services/session';
import type { SettingsStorage } from 'swach/storages/settings';
import viewTransitions from 'swach/utils/view-transitions';

export default class KulerRoute extends Route {
  queryParams = {
    colorId: {
      refreshModel: true,
    },
  };

  @service declare session: Session;
  @service declare store: Store;

  @storageFor('settings') settings!: SettingsStorage;

  beforeModel(transition: Transition): void {
    if (this.settings.get('userHasLoggedInBefore')) {
      this.session.requireAuthentication(transition, 'settings.cloud.login');
    }
  }

  async model({
    colorId,
  }: {
    colorId: string;
  }): Promise<ColorModel | undefined> {
    if (colorId) {
      const color = await this.store.findRecord('color', colorId);

      return <ColorModel>color;
    }
  }

  async afterModel() {
    await viewTransitions();
  }
}

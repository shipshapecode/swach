import Route from '@ember/routing/route';
import type Transition from '@ember/routing/transition';
import { service } from '@ember/service';

import { storageFor } from 'ember-local-storage';
import { orbit, type Store } from 'ember-orbit';

import type ColorModel from '../data-models/color.ts';
import type Session from '../services/session.ts';
import type { SettingsStorage } from '../storages/settings.ts';
import viewTransitions from '../utils/view-transitions.ts';

export default class KulerRoute extends Route {
  queryParams = {
    colorId: {
      refreshModel: true,
    },
  };

  @orbit declare store: Store;

  @service declare session: Session;

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

import type Transition from '@ember/routing/-private/transition';
import Route from '@ember/routing/route';
import { service } from '@ember/service';

import { storageFor } from 'ember-local-storage';
import type { Store } from 'ember-orbit';
import type Session from 'ember-simple-auth/services/session';

import type ColorModel from 'swach/data-models/color';
import type { SettingsStorage } from 'swach/storages/settings';

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
}

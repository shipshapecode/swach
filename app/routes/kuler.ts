import Transition from '@ember/routing/-private/transition';
import Route from '@ember/routing/route';
import { service } from '@ember/service';

import { storageFor } from 'ember-local-storage';
import { Store } from 'ember-orbit';
import Session from 'ember-simple-auth/services/session';

import ColorModel from 'swach/data-models/color';
import { SettingsStorage } from 'swach/storages/settings';

export default class KulerRoute extends Route {
  queryParams = {
    colorId: {
      refreshModel: true
    }
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
    colorId
  }: {
    colorId: string;
  }): Promise<ColorModel | undefined> {
    if (colorId) {
      const color = await this.store.findRecord('color', colorId);
      return <ColorModel>color;
    }
  }
}

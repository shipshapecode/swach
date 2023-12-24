import Route from '@ember/routing/route';
import { service } from '@ember/service';

import { storageFor } from 'ember-local-storage';

import type Transition from '@ember/routing/-private/transition';
import type { Store } from 'ember-orbit';
import type Session from 'ember-simple-auth/services/session';
import type PaletteModel from 'swach/data-models/palette';
import type { SettingsStorage } from 'swach/storages/settings';

export default class ColorsRoute extends Route {
  queryParams = {
    paletteId: {
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
    paletteId,
  }: {
    paletteId: string;
  }): Promise<PaletteModel | undefined> {
    if (paletteId) {
      const palette = await this.store.findRecord('palette', paletteId);

      return <PaletteModel>palette;
    }
  }
}

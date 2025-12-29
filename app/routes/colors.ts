import Route from '@ember/routing/route';
import type Transition from '@ember/routing/transition';
import { service } from '@ember/service';

import { storageFor } from 'ember-local-storage';
import { orbit, type Store } from 'ember-orbit';

import type PaletteModel from '../data-models/palette.ts';
import type Session from '../services/session.ts';
import type { SettingsStorage } from '../storages/settings.ts';
import viewTransitions from '../utils/view-transitions.ts';

export default class ColorsRoute extends Route {
  queryParams = {
    paletteId: {
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
    paletteId,
  }: {
    paletteId: string;
  }): Promise<PaletteModel | undefined> {
    if (paletteId) {
      const palette = await this.store.findRecord('palette', paletteId);

      return <PaletteModel>palette;
    }
  }

  async afterModel() {
    await viewTransitions();
  }
}

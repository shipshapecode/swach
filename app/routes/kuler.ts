import Transition from '@ember/routing/-private/transition';
import Route from '@ember/routing/route';
import { service } from '@ember/service';

import { Store } from 'ember-orbit';
import Session from 'ember-simple-auth/services/session';

import ColorModel from 'swach/data-models/color';

export default class KulerRoute extends Route {
  queryParams = {
    colorId: {
      refreshModel: true
    }
  };

  @service session!: Session;
  @service store!: Store;

  beforeModel(transition: Transition): void {
    this.session.requireAuthentication(transition, 'settings.cloud.login');
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

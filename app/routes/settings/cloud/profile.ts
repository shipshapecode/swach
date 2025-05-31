import Route from '@ember/routing/route';
import { service } from '@ember/service';

import type CognitoService from 'ember-cognito/services/cognito';

import type Session from 'swach/services/session';
import viewTransitions from 'swach/utils/view-transitions';

export default class SettingsAccountRoute extends Route {
  @service declare cognito: CognitoService;
  @service declare session: Session;

  model(): CognitoService['user']['attributes'] {
     
    console.log(this.cognito);

    return this.cognito.user?.attributes;
  }

  async afterModel() {
    await viewTransitions();
  }
}

import Route from '@ember/routing/route';
import { service } from '@ember/service';

import type CognitoService from 'ember-cognito/services/cognito';

import type Session from '../../../services/session.ts';
import viewTransitions from '../../../utils/view-transitions.ts';

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

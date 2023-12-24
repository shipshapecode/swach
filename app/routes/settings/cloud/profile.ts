import Route from '@ember/routing/route';
import { service } from '@ember/service';

import type CognitoService from 'ember-cognito/services/cognito';
import type Session from 'ember-simple-auth/services/session';

export default class SettingsAccountRoute extends Route {
  @service declare cognito: CognitoService;
  @service declare session: Session;

  model(): CognitoService['user']['attributes'] {
    console.log(this.cognito);

    return this.cognito.user?.attributes;
  }
}

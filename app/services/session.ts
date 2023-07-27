import { inject as service } from '@ember/service';

import BaseSessionService from 'ember-simple-auth/services/session';

import type DataService from 'swach/services/data';

export default class SessionService extends BaseSessionService {
  @service('data') declare swachData: DataService;

  async handleAuthentication() {
    super.handleAuthentication(...arguments);

    this.swachData.synchronize();
  }

  async handleInvalidation() {
    super.handleInvalidation(...arguments);

    this.swachData.reset();
  }
}

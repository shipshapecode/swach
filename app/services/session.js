import { inject as service } from '@ember/service';

import BaseSessionService from 'ember-simple-auth/services/session';

export default class SessionService extends BaseSessionService {
  @service('data') swachData;

  async handleAuthentication() {
    super.handleAuthentication(...arguments);

    this.swachData.synchronize();
  }

  async handleInvalidation() {
    super.handleInvalidation(...arguments);

    this.swachData.reset();
  }
}

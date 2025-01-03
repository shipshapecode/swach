import { inject as service } from '@ember/service';

import BaseSessionService from 'ember-simple-auth/services/session';

import DataService from './data';

interface Data {
  authenticated: {
    id: string;
  };
}

export default class SessionService extends BaseSessionService<Data> {
  @service('data') declare swachData: DataService;

  async handleAuthentication(routeAfterAuthentication: string) {
    super.handleAuthentication(routeAfterAuthentication);

    this.swachData.synchronize();
  }

  async handleInvalidation(routeAfterInvalidation: string) {
    super.handleInvalidation(routeAfterInvalidation);

    this.swachData.reset();
  }
}

import { service } from '@ember/service';

import BaseSessionService from 'ember-simple-auth/services/session';

import type DataService from './data.ts';

interface SupabaseAuthData {
  authenticated: {
    userId: string;
    email: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
}

export default class SessionService extends BaseSessionService<SupabaseAuthData> {
  @service('data') declare swachData: DataService;

  handleAuthentication(routeAfterAuthentication: string) {
    super.handleAuthentication(routeAfterAuthentication);

    void this.swachData.synchronize();
  }

  handleInvalidation(routeAfterInvalidation: string) {
    super.handleInvalidation(routeAfterInvalidation);

    void this.swachData.reset();
  }
}

import { service } from '@ember/service';

import BaseSessionService from 'ember-simple-auth/services/session';

import type { SupabaseAuthData } from '../authenticators/supabase.ts';
import type DataService from './data.ts';

interface SessionData {
  authenticated: SupabaseAuthData;
}

export default class SessionService extends BaseSessionService<SessionData> {
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

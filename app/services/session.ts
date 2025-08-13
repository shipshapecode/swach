import { service } from '@ember/service';
import BaseSessionService from 'ember-simple-auth/services/session';
import DataService from './data';

interface Data {
  authenticated: {
    id: string;
  };
}

export default class SessionService extends BaseSessionService<Data> {
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

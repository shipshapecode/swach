import Route from '@ember/routing/route';
import { service } from '@ember/service';

import type Session from '../../../services/session.ts';
import viewTransitions from '../../../utils/view-transitions.ts';

interface ProfileModel {
  email?: string;
  userId?: string;
}

export default class SettingsAccountRoute extends Route {
  @service declare session: Session;

  model(): ProfileModel {
    const authData = this.session.data?.authenticated;

    return {
      email: authData?.email,
      userId: authData?.userId,
    };
  }

  async afterModel() {
    await viewTransitions();
  }
}

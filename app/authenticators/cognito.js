import { service } from '@ember/service';

import CognitoAuthenticator from 'ember-cognito/authenticators/cognito';

export default class CognitoAuthenticatorExtended extends CognitoAuthenticator {
  @service cognito;

  _makeAuthData(user, session, credentials) {
    return {
      poolId: user.pool.getUserPoolId(),
      clientId: user.pool.getClientId(),
      sessionCredentials: credentials,
      access_token: session.getIdToken().getJwtToken(),
    };
  }

  async _resolveAuth(user) {
    const { cognito } = this;
    cognito._setUser(user);

    // Now pull out the (promisified) user
    const session = await cognito.user.getSession();
    const credentials = await this.auth.currentCredentials();

    cognito.startRefreshTask(session);
    return this._makeAuthData(user, session, credentials);
  }

  async _handleRefresh() {
    const { cognito } = this;
    const { auth, user } = cognito;
    // Get the session, which will refresh it if necessary
    const session = await user.getSession();
    if (session.isValid()) {
      cognito.startRefreshTask(session);
      const awsUser = await auth.currentAuthenticatedUser();
      const credentials = await this.auth.currentCredentials();

      return this._makeAuthData(awsUser, session, credentials);
    } else {
      throw new Error('session is invalid');
    }
  }
}

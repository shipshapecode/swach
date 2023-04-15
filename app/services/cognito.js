import { inject as service } from '@ember/service';

import CognitoService from 'ember-cognito/services/cognito';

import ENV from '../config/environment';

const cognitoEnv = Object.assign(
  {
    autoRefreshSession: false,
  },
  ENV.cognito
);

export default class CognitoServiceExtended extends CognitoService {
  @service session;
  poolId = cognitoEnv.poolId;
  clientId = cognitoEnv.clientId;
  identityPoolId = cognitoEnv.identityPoolId;
  region = cognitoEnv.region;
  autoRefreshSession = cognitoEnv.autoRefreshSession;
  authenticationFlowType = cognitoEnv.authenticationFlowType;

  /**
   * Configures the Amplify library with the pool & client IDs, and any additional
   * configuration.
   * @param awsconfig Extra AWS configuration.
   */
  configure(awsconfig) {
    const { poolId, clientId, region, identityPoolId } = this;
    const params = Object.assign(
      {
        identityPoolId: identityPoolId,
        region: region,
        userPoolId: poolId,
        userPoolWebClientId: clientId,
      },
      awsconfig
    );

    this.auth.configure(params);
  }
}

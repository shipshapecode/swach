import { getOwner } from '@ember/owner';
import { service } from '@ember/service';
import CognitoService from 'ember-cognito/services/cognito';

export default class CognitoServiceExtended extends CognitoService {
  @service session;

  constructor() {
    super(...arguments);

    const config = getOwner(this).resolveRegistration('config:environment');
    const cognitoEnv = config.cognito ?? {};

    this.poolId = cognitoEnv.poolId;
    this.clientId = cognitoEnv.clientId;
    this.identityPoolId = cognitoEnv.identityPoolId;
    this.region = cognitoEnv.region;
    this.autoRefreshSession = cognitoEnv.autoRefreshSession ?? false;
    this.authenticationFlowType = cognitoEnv.authenticationFlowType;
  }

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

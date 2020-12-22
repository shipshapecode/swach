import Service from '@ember/service';

declare module 'ember-cognito/services/cognito' {
  export default class CognitoService extends Service {
    user: { attributes: { email: string; email_verified: boolean } };
    forgotPassword(username: string): unknown;
    forgotPasswordSubmit(
      username: string,
      code: string,
      password: string
    ): unknown;
  }
}

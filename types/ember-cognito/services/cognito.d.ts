import Service from '@ember/service';

declare module 'ember-cognito/services/cognito' {
  export default class CognitoService extends Service {
    forgotPassword(username: string): unknown;
    forgotPasswordSubmit(
      username: string,
      code: string,
      password: string
    ): unknown;
  }
}

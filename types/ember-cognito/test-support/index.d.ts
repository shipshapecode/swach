import EmberObject from '@ember/object';
declare module 'ember-cognito/test-support' {
  export const MockAuth = EmberObject.extend({
    async confirmSignUp(username: string, confirmationCode: string) {},
    signUp() {}
  });
  export const MockUser = EmberObject.extend({ create() {} });
  export const mockAuth = any;
  export declare function mockCognitoUser(options: {} = {}): MockUser;
}

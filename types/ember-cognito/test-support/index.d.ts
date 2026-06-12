import EmberObject from '@ember/object';
declare module 'ember-cognito/test-support' {
  // eslint-disable-next-line ember/no-classic-classes
  export const MockAuth = EmberObject.extend({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async confirmSignUp(username: string, confirmationCode: string) {},
    signUp() {}
  });
  // eslint-disable-next-line ember/no-classic-classes
  export const MockUser = EmberObject.extend({ create() {} });
  export const mockAuth = any;
  export declare function mockCognitoUser(options: object = {}): MockUser;
}

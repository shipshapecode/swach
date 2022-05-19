import { click, currentURL, fillIn, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';

import {
  MockAuth,
  MockUser,
  mockAuth,
  mockCognitoUser
} from 'ember-cognito/test-support';

import sinon from 'sinon';

import { resetStorage, waitForAll } from 'swach/tests/helpers';
import { setupApplicationTest } from 'swach/tests/helpers/index';

module('Acceptance | settings/cloud', function (hooks) {
  setupApplicationTest(hooks);
  resetStorage(hooks, { seed: { source: 'backup', scenario: 'basic' } });

  test('visiting /settings/cloud', async function (assert) {
    await visit('/settings/cloud/login');

    assert.strictEqual(currentURL(), '/settings/cloud/login');
  });

  test('user can sign up', async function (assert) {
    assert.expect(5);

    await mockAuth(
      MockAuth.extend({
        async signUp() {
          assert.ok(true, 'signUp has been called');
          return MockUser.create({
            username: 'testuser@gmail.com',
            attributes: {
              sub: 'aaaabbbb-cccc-dddd-eeee-ffffgggghhhh',
              email: 'testuser@gmail.com',
              email_verified: 'false'
            }
          });
        },
        async confirmSignUp(username: string, confirmationCode: string) {
          assert.strictEqual(
            username,
            'testuser@gmail.com',
            'username is correct'
          );
          assert.strictEqual(
            confirmationCode,
            '1234',
            'confirmationCode is correct'
          );
          return;
        }
      })
    );

    await visit('/settings/cloud/register');
    await fillIn('[data-test-register-input-user]', 'testuser@gmail.com');
    await fillIn('[data-test-register-input-password]', 'password');
    await click('[data-test-register-submit]');
    await waitForAll();

    assert.strictEqual(
      currentURL(),
      '/settings/cloud/register/confirm',
      'transitioned to register/confirm route'
    );
    await fillIn('[data-test-register-input-user]', 'testuser@gmail.com');
    await fillIn('[data-test-register-input-code]', '1234');
    await click('[data-test-register-submit]');
    await waitForAll();

    assert.strictEqual(
      currentURL(),
      '/settings/cloud/login',
      'transitioned to login route'
    );
  });

  test('user can log in and log out', async function (assert) {
    await visit('/settings/cloud/login');
    await waitForAll();

    await mockCognitoUser({
      username: 'testuser@gmail.com',
      attributes: {
        sub: 'aaaabbbb-cccc-dddd-eeee-ffffgggghhhh',
        email: 'testuser@gmail.com',
        email_verified: 'false'
      }
    });
    const authenticator = this.owner.lookup('authenticator:cognito');
    const authenticateStub = sinon
      .stub(authenticator, 'authenticate')
      .resolves();

    const dataService = this.owner.lookup('service:data');
    const synchronizeStub = sinon.stub(dataService, 'synchronize').resolves();
    const resetStub = sinon.stub(dataService, 'reset').resolves();

    await fillIn('[data-test-login-input-user]', 'testuser@gmail.com');
    await fillIn('[data-test-login-input-password]', 'password');
    await click('[data-test-login-submit]');
    await waitForAll();

    assert.strictEqual(authenticateStub.callCount, 1, 'authenticate called');
    assert.strictEqual(synchronizeStub.callCount, 1, 'synchronize called');
    assert.strictEqual(resetStub.callCount, 0, 'reset NOT called yet');

    assert.strictEqual(currentURL(), '/settings/cloud/profile');
    assert
      .dom('[data-test-profile-detail="email"]')
      .hasText('testuser@gmail.com');

    await click('[data-test-logout-submit]');
    await waitForAll();

    assert.strictEqual(resetStub.callCount, 1, 'reset called');
  });
});

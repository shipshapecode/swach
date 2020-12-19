import { module, test } from 'qunit';
import { visit, click, currentURL, fillIn } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import resetStorages from 'ember-local-storage/test-support/reset-storage';
import { mockCognitoUser } from 'ember-cognito/test-support';
import sinon from 'sinon';
import { waitForAll } from 'swach/tests/helpers';
import seedOrbit from '../../orbit/seed';

let sinonSandBox: any;

module('Acceptance | settings/cloud', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(async function () {
    sinonSandBox = await sinon.createSandbox();
    await seedOrbit(this.owner);
    await visit('/settings');
  });

  hooks.afterEach(function () {
    resetStorages();
    sinonSandBox.restore();
  });

  test('visiting /settings/cloud', async function (assert) {
    await visit('/settings/cloud/login');

    assert.equal(currentURL(), '/settings/cloud/login');
  });

  test('user can login', async function (assert) {
    await mockCognitoUser({
      username: 'testuser@gmail.com',
      attributes: {
        sub: 'aaaabbbb-cccc-dddd-eeee-ffffgggghhhh',
        email: 'testuser@gmail.com',
        email_verified: 'false'
      }
    });
    const authenticator = this.owner.lookup('authenticator:cognito');
    sinonSandBox.stub(authenticator, 'authenticate').resolves();

    await visit('/settings/cloud/login');
    await fillIn('[data-test-login-input-user]', 'testuser@gmail.com');
    await fillIn('[data-test-login-input-password]', 'password');
    await click('[data-test-login-submit]');
    await waitForAll();

    assert.equal(currentURL(), '/settings/cloud/profile');
    assert
      .dom('[data-test-profile-detail="email"]')
      .hasText('testuser@gmail.com');
  });
});

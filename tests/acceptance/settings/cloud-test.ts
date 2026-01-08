import { click, currentURL, fillIn, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import sinon from 'sinon';

import type DataService from 'Swach/services/data';
import type SupabaseService from 'Swach/services/supabase';

import { resetStorage, waitForAll } from '../../helpers';
import { setupApplicationTest } from '../../helpers/index.ts';

module('Acceptance | settings/cloud', function (hooks) {
  setupApplicationTest(hooks);
  resetStorage(hooks, { seed: { source: 'backup', scenario: 'basic' } });

  test('visiting /settings/cloud/login', async function (assert) {
    await visit('/settings/cloud/login');

    assert.strictEqual(currentURL(), '/settings/cloud/login');
    assert.dom('[data-test-login-input-user]').exists('email input exists');
    assert
      .dom('[data-test-login-submit]')
      .hasText('Send Code', 'button shows send code');
  });

  test('user can request OTP code', async function (assert) {
    await visit('/settings/cloud/login');

    const supabaseService = this.owner.lookup(
      'service:supabase'
    ) as SupabaseService;
    const signInWithOtpStub = sinon
      .stub(supabaseService, 'signInWithOtp')
      .resolves();

    await fillIn('[data-test-login-input-user]', 'testuser@gmail.com');
    await click('[data-test-login-submit]');
    await waitForAll();

    assert.strictEqual(
      signInWithOtpStub.callCount,
      1,
      'signInWithOtp was called'
    );
    assert.strictEqual(
      signInWithOtpStub.firstCall.args[0],
      'testuser@gmail.com',
      'email was passed correctly'
    );

    // Should now show OTP input
    assert.dom('[data-test-login-input-otp]').exists('OTP input is shown');
    assert.dom('[data-test-login-submit]').hasText('Verify Code');
  });

  test('user can verify OTP and log in', async function (assert) {
    await visit('/settings/cloud/login');
    await waitForAll();

    const supabaseService = this.owner.lookup(
      'service:supabase'
    ) as SupabaseService;
    sinon.stub(supabaseService, 'signInWithOtp').resolves();
    sinon.stub(supabaseService, 'signOut').resolves();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authenticator = this.owner.lookup('authenticator:supabase') as any;
    const authenticateStub = sinon
      .stub(authenticator, 'authenticate')
      .resolves({
        userId: 'test-user-id',
        email: 'testuser@gmail.com',
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
      });

    const dataService = this.owner.lookup(
      'service:data'
    ) as unknown as DataService;
    const synchronizeStub = sinon.stub(dataService, 'synchronize').resolves();
    sinon.stub(dataService, 'reset').resolves();

    // Step 1: Enter email and request OTP
    await fillIn('[data-test-login-input-user]', 'testuser@gmail.com');
    await click('[data-test-login-submit]');
    await waitForAll();

    // Step 2: Enter OTP code
    await fillIn('[data-test-login-input-otp]', '123456');
    await click('[data-test-login-submit]');
    await waitForAll();

    assert.strictEqual(authenticateStub.callCount, 1, 'authenticate called');
    assert.deepEqual(
      authenticateStub.firstCall.args[0],
      { email: 'testuser@gmail.com', token: '123456' },
      'authenticate called with correct credentials'
    );
    assert.strictEqual(synchronizeStub.callCount, 1, 'synchronize called');

    assert.strictEqual(currentURL(), '/settings/cloud/profile');
    assert
      .dom('[data-test-profile-detail="email"]')
      .hasText('testuser@gmail.com');
  });

  test('user can see OTP verification step', async function (assert) {
    await visit('/settings/cloud/login');

    const supabaseService = this.owner.lookup(
      'service:supabase'
    ) as SupabaseService;
    const signInWithOtpStub = sinon
      .stub(supabaseService, 'signInWithOtp')
      .resolves();

    // Request first OTP
    await fillIn('[data-test-login-input-user]', 'testuser@gmail.com');
    await click('[data-test-login-submit]');
    await waitForAll();

    assert.strictEqual(signInWithOtpStub.callCount, 1, 'first OTP requested');

    // Verify OTP step is shown correctly
    assert.dom('[data-test-login-input-otp]').exists('OTP input shown');
    assert.dom('[data-test-login-submit]').hasText('Verify Code');
  });

  test('shows error message on invalid OTP', async function (assert) {
    await visit('/settings/cloud/login');

    const supabaseService = this.owner.lookup(
      'service:supabase'
    ) as SupabaseService;
    sinon.stub(supabaseService, 'signInWithOtp').resolves();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authenticator = this.owner.lookup('authenticator:supabase') as any;
    sinon
      .stub(authenticator, 'authenticate')
      .rejects(new Error('Invalid or expired OTP'));

    // Request OTP
    await fillIn('[data-test-login-input-user]', 'testuser@gmail.com');
    await click('[data-test-login-submit]');
    await waitForAll();

    // Enter invalid OTP
    await fillIn('[data-test-login-input-otp]', '000000');
    await click('[data-test-login-submit]');
    await waitForAll();

    // Should show error and stay on login page
    assert.dom('[data-test-login-error]').exists('error message is shown');
    assert.strictEqual(
      currentURL(),
      '/settings/cloud/login',
      'still on login page'
    );
  });
});

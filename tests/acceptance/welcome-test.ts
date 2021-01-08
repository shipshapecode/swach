import { click, currentURL, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { module, test } from 'qunit';

import resetStorages from 'ember-local-storage/test-support/reset-storage';

import { waitForAll } from 'swach/tests/helpers';

module('Acceptance | welcome', function (hooks) {
  setupApplicationTest(hooks);

  hooks.afterEach(function () {
    // Not sure why we need to manually call this, and resetStorages is not resetting, but the toggles were storing old values.
    localStorage.removeItem('storage:settings');
    resetStorages();
  });

  test('welcome flow', async function (assert) {
    await visit('/welcome');

    assert.equal(currentURL(), '/welcome');

    await click('[data-test-link-auto-start]');
    await waitForAll();

    assert.equal(currentURL(), '/welcome/auto-start');

    assert
      .dom('[data-test-auto-start-toggle]')
      .hasStyle({ backgroundColor: 'rgb(229, 231, 235)' });
    await click('[data-test-auto-start-toggle]');
    assert
      .dom('[data-test-auto-start-toggle]')
      .hasStyle({ backgroundColor: 'rgb(52, 211, 153)' });

    await click('[data-test-link-dock-icon]');
    await waitForAll();

    assert.equal(currentURL(), '/welcome/dock-icon');

    assert
      .dom('[data-test-show-dock-icon-toggle]')
      .hasStyle({ backgroundColor: 'rgb(229, 231, 235)' });
    await click('[data-test-show-dock-icon-toggle]');
    assert
      .dom('[data-test-show-dock-icon-toggle]')
      .hasStyle({ backgroundColor: 'rgb(52, 211, 153)' });
  });
});

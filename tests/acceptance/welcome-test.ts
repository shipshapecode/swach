import { click, currentURL, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { module, test } from 'qunit';

import { resetStorage, waitForAll } from 'swach/tests/helpers';

module('Acceptance | welcome', function (hooks) {
  setupApplicationTest(hooks);
  resetStorage(hooks);

  test('welcome flow', async function (assert) {
    await visit('/welcome');

    assert.strictEqual(currentURL(), '/welcome');

    await click('[data-test-link-auto-start]');
    await waitForAll();

    assert.strictEqual(currentURL(), '/welcome/auto-start');

    assert
      .dom('[data-test-auto-start-toggle]')
      .hasProperty('ariaPressed', 'false');

    await click('[data-test-auto-start-toggle]');

    await waitForAll();

    assert
      .dom('[data-test-auto-start-toggle]')
      .hasProperty('ariaPressed', 'true');

    await click('[data-test-link-dock-icon]');
    await waitForAll();

    assert.strictEqual(currentURL(), '/welcome/dock-icon');

    assert
      .dom('[data-test-show-dock-icon-toggle]')
      .hasProperty('ariaPressed', 'false');

    await click('[data-test-show-dock-icon-toggle]');
    await waitForAll();

    assert
      .dom('[data-test-show-dock-icon-toggle]')
      .hasProperty('ariaPressed', 'true');
  });
});

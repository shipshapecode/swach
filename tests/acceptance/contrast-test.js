import {
  currentURL,
  fillIn,
  triggerKeyEvent,
  visit
} from '@ember/test-helpers';
import { module, test } from 'qunit';

import { resetStorage, waitForAll } from 'swach/tests/helpers';
import { setupApplicationTest } from 'swach/tests/helpers/index';

module('Acceptance | contrast', function (hooks) {
  setupApplicationTest(hooks);
  resetStorage(hooks, { seed: { source: 'backup', scenario: 'basic' } });

  hooks.beforeEach(async function () {
    await visit('/contrast');
  });

  test('visiting /contrast', async function (assert) {
    assert.strictEqual(currentURL(), '/contrast');
  });

  test('has default value on open', function (assert) {
    assert.dom('[data-test-wcag-score]').hasText('21.00');
    assert.dom('[data-test-wcag-string]').hasText('AAA');
  });

  test('updates score when failing background value added', async function (assert) {
    await waitForAll();

    await fillIn('[data-test-bg-input]', '#504F4F');
    await triggerKeyEvent('[data-test-bg-input]', 'keypress', 13);

    await waitForAll();

    assert.dom('[data-test-wcag-score]').hasText('2.57');
    assert.dom('[data-test-wcag-string]').hasText('Fail');
  });
});

import {
  blur,
  currentURL,
  fillIn,
  find,
  visit,
  waitUntil,
} from '@ember/test-helpers';
import { module, test } from 'qunit';

import { resetStorage, waitForAll } from '../helpers';
import { setupApplicationTest } from '../helpers/index';

module('Acceptance | contrast', function (hooks) {
  setupApplicationTest(hooks);
  resetStorage(hooks, { seed: { source: 'backup', scenario: 'basic' } });

  test('visiting /contrast', async function (assert) {
    await visit('/contrast');
    await waitForAll();

    assert.strictEqual(currentURL(), '/contrast');
  });

  test('has default value on open', async function (assert) {
    await visit('/contrast');
    await waitForAll();
    // Wait for the color pickers to be initialized and score to be computed
    await waitUntil(
      () => {
        const scoreElement = find('[data-test-wcag-score]');
        const stringElement = find('[data-test-wcag-string]');
        return (
          scoreElement?.textContent.trim() === '21.00' &&
          stringElement?.textContent.trim() === 'AAA'
        );
      },
      { timeout: 2000 }
    );

    assert.dom('[data-test-wcag-score]').hasText('21.00');
    assert.dom('[data-test-wcag-string]').hasText('AAA');
  });

  test('updates score when failing background value added', async function (assert) {
    await visit('/contrast');
    await waitForAll();

    // Wait for initial state to be ready
    await waitUntil(
      () => find('[data-test-wcag-score]')?.textContent.trim() === '21.00',
      { timeout: 2000 }
    );

    await fillIn('[data-test-bg-input]', '#504F4F');

    // Explicitly trigger blur to ensure the color updates
    await blur('[data-test-bg-input]');

    await waitForAll();

    // Additional wait for Electron environment
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Wait for the background color to update and score to recalculate
    await waitUntil(
      () => {
        const scoreElement = find('[data-test-wcag-score]');
        const stringElement = find('[data-test-wcag-string]');

        return (
          scoreElement?.textContent.trim() === '2.57' &&
          stringElement?.textContent.trim() === 'Fail'
        );
      },
      { timeout: 5000 }
    );

    assert.dom('[data-test-wcag-score]').hasText('2.57');
    assert.dom('[data-test-wcag-string]').hasText('Fail');
  });
});

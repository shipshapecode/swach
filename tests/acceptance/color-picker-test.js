import { blur, click, fillIn, triggerEvent, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';

import { animationsSettled } from 'ember-animated/test-support';

import { resetStorage, waitForAll } from 'swach/tests/helpers';
import { setupApplicationTest } from 'swach/tests/helpers/index';

module('Acceptance | color-picker', function (hooks) {
  setupApplicationTest(hooks);
  resetStorage(hooks, { seed: { source: 'backup', scenario: 'basic' } });

  module('inputs', function () {
    test('hex input updates rgba', async function (assert) {
      await visit('/colors?paletteId=color-history-123');

      await click(
        '[data-test-color="Black"] [data-test-color-row-menu] [data-test-options-trigger]'
      );

      await animationsSettled();

      await click('[data-test-color="Black"] [data-test-edit-color]');

      await waitForAll();

      assert.dom('[data-test-color-picker]').exists();

      assert.dom('[data-test-color-picker-hex]').hasValue('#000000');
      assert.dom('[data-test-color-picker-r]').hasValue('0');
      assert.dom('[data-test-color-picker-g]').hasValue('0');
      assert.dom('[data-test-color-picker-b]').hasValue('0');
      assert.dom('[data-test-color-picker-a]').hasValue('1');

      await fillIn('[data-test-color-picker-hex]', '#ffffff0e');
      await triggerEvent('[data-test-color-picker-hex]', 'complete');

      await waitForAll();

      assert.dom('[data-test-color-picker-hex]').hasValue('#ffffff0e');
      assert.dom('[data-test-color-picker-r]').hasValue('255');
      assert.dom('[data-test-color-picker-g]').hasValue('255');
      assert.dom('[data-test-color-picker-b]').hasValue('255');
      assert.dom('[data-test-color-picker-a]').hasValue('0.05');
    });
  });

  module('red', function () {
    test('incomplete clears input', async function (assert) {
      await visit('/colors?paletteId=color-history-123');

      await click(
        '[data-test-color="Black"] [data-test-color-row-menu] [data-test-options-trigger]'
      );

      await animationsSettled();

      await click('[data-test-color="Black"] [data-test-edit-color]');

      await waitForAll();

      assert.dom('[data-test-color-picker]').exists();
      assert.dom('[data-test-color-picker-r]').hasValue('0');

      await fillIn('[data-test-color-picker-r]', '255');
      await triggerEvent('[data-test-color-picker-r]', 'complete');
      await fillIn('[data-test-color-picker-r]', '');
      await blur('[data-test-color-picker-r]');

      assert.dom('[data-test-color-picker-r]').hasValue('255');
    });

    test('values capped at 255', async function (assert) {
      await visit('/colors?paletteId=color-history-123');

      await click(
        '[data-test-color="Black"] [data-test-color-row-menu] [data-test-options-trigger]'
      );

      await animationsSettled();

      await click('[data-test-color="Black"] [data-test-edit-color]');

      await waitForAll();

      assert.dom('[data-test-color-picker]').exists();
      assert.dom('[data-test-color-picker-r]').hasValue('0');

      await fillIn('[data-test-color-picker-r]', '400');
      await triggerEvent('[data-test-color-picker-r]', 'complete');
      await blur('[data-test-color-picker-r]');

      assert.dom('[data-test-color-picker-r]').hasValue('255');
    });
  });

  module('green', function () {
    test('incomplete clears input', async function (assert) {
      await visit('/colors?paletteId=color-history-123');

      await click(
        '[data-test-color="Black"] [data-test-color-row-menu] [data-test-options-trigger]'
      );

      await animationsSettled();

      await click('[data-test-color="Black"] [data-test-edit-color]');

      await waitForAll();

      assert.dom('[data-test-color-picker]').exists();
      assert.dom('[data-test-color-picker-g]').hasValue('0');

      await fillIn('[data-test-color-picker-g]', '125');
      await triggerEvent('[data-test-color-picker-g]', 'complete');
      await fillIn('[data-test-color-picker-g]', '');
      await blur('[data-test-color-picker-g]');

      assert.dom('[data-test-color-picker-g]').hasValue('125');
    });

    test('values capped at 255', async function (assert) {
      await visit('/colors?paletteId=color-history-123');

      await click(
        '[data-test-color="Black"] [data-test-color-row-menu] [data-test-options-trigger]'
      );

      await animationsSettled();

      await click('[data-test-color="Black"] [data-test-edit-color]');

      await waitForAll();

      assert.dom('[data-test-color-picker]').exists();
      assert.dom('[data-test-color-picker-g]').hasValue('0');

      await fillIn('[data-test-color-picker-g]', '400');
      await triggerEvent('[data-test-color-picker-g]', 'complete');
      await blur('[data-test-color-picker-g]');

      assert.dom('[data-test-color-picker-g]').hasValue('255');
    });
  });

  module('blue', function () {
    test('incomplete clears input', async function (assert) {
      await visit('/colors?paletteId=color-history-123');

      await click(
        '[data-test-color="Black"] [data-test-color-row-menu] [data-test-options-trigger]'
      );

      await animationsSettled();

      await click('[data-test-color="Black"] [data-test-edit-color]');

      await waitForAll();

      assert.dom('[data-test-color-picker]').exists();
      assert.dom('[data-test-color-picker-b]').hasValue('0');

      await fillIn('[data-test-color-picker-b]', '42');
      await triggerEvent('[data-test-color-picker-b]', 'complete');
      await fillIn('[data-test-color-picker-b]', '');
      await blur('[data-test-color-picker-b]');

      assert.dom('[data-test-color-picker-b]').hasValue('42');
    });

    test('values capped at 255', async function (assert) {
      await visit('/colors?paletteId=color-history-123');

      await click(
        '[data-test-color="Black"] [data-test-color-row-menu] [data-test-options-trigger]'
      );

      await animationsSettled();

      await click('[data-test-color="Black"] [data-test-edit-color]');

      await waitForAll();

      assert.dom('[data-test-color-picker]').exists();
      assert.dom('[data-test-color-picker-b]').hasValue('0');

      await fillIn('[data-test-color-picker-b]', '400');
      await triggerEvent('[data-test-color-picker-b]', 'complete');
      await blur('[data-test-color-picker-b]');

      assert.dom('[data-test-color-picker-b]').hasValue('255');
    });
  });

  module('alpha', function () {
    test('incomplete clears input', async function (assert) {
      await visit('/colors?paletteId=color-history-123');

      await click(
        '[data-test-color="Black"] [data-test-color-row-menu] [data-test-options-trigger]'
      );

      await animationsSettled();

      await click('[data-test-color="Black"] [data-test-edit-color]');

      await waitForAll();

      assert.dom('[data-test-color-picker]').exists();
      assert.dom('[data-test-color-picker-a]').hasValue('1');

      await fillIn('[data-test-color-picker-a]', '0.52');
      await triggerEvent('[data-test-color-picker-a]', 'complete');
      await fillIn('[data-test-color-picker-a]', '');
      await blur('[data-test-color-picker-a]');

      assert.dom('[data-test-color-picker-a]').hasValue('0.52');
    });

    test('values capped at 1', async function (assert) {
      await visit('/colors?paletteId=color-history-123');

      await click(
        '[data-test-color="Black"] [data-test-color-row-menu] [data-test-options-trigger]'
      );

      await animationsSettled();

      await click('[data-test-color="Black"] [data-test-edit-color]');

      await waitForAll();

      assert.dom('[data-test-color-picker]').exists();
      assert.dom('[data-test-color-picker-a]').hasValue('1');

      await fillIn('[data-test-color-picker-a]', '1.50');
      await triggerEvent('[data-test-color-picker-a]', 'complete');
      await blur('[data-test-color-picker-a]');

      assert.dom('[data-test-color-picker-a]').hasValue('1');
    });
  });
});

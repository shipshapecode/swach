import {
  blur,
  click,
  currentURL,
  fillIn,
  triggerEvent,
  visit
} from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { module, test } from 'qunit';

import { animationsSettled } from 'ember-animated/test-support';

import { resetStorage, waitForAll } from 'swach/tests/helpers';

module('Acceptance | kuler', function (hooks) {
  setupApplicationTest(hooks);
  resetStorage(hooks, { seed: { source: 'backup', scenario: 'basic' } });

  hooks.beforeEach(async function () {
    await visit('/kuler?colorId=pale-magenta');
  });

  test('visiting /kuler with query parameters', function (assert) {
    assert.strictEqual(currentURL(), '/kuler?colorId=pale-magenta');
  });

  test('analogous palette', async function (assert) {
    await fillIn('[data-test-kuler-select]', 'Analogous');

    assert
      .dom(
        '[data-test-kuler-palette="Analogous"] [data-test-kuler-palette-name]'
      )
      .hasText('Analogous');

    assert
      .dom(
        '[data-test-kuler-palette="Analogous"] [data-test-kuler-palette-color]'
      )
      .exists({ count: 5 });
  });

  test('monochromatic palette', async function (assert) {
    await fillIn('[data-test-kuler-select]', 'Monochromatic');

    assert
      .dom(
        '[data-test-kuler-palette="Monochromatic"] [data-test-kuler-palette-name]'
      )
      .hasText('Monochromatic');

    assert
      .dom(
        '[data-test-kuler-palette="Monochromatic"] [data-test-kuler-palette-color]'
      )
      .exists({ count: 5 });

    assert
      .dom(
        '[data-test-kuler-palette="Monochromatic"] [data-test-kuler-palette-color="0"]'
      )
      .hasStyle({
        backgroundColor: 'rgb(247, 138, 224)'
      });

    assert
      .dom(
        '[data-test-kuler-palette="Monochromatic"] [data-test-kuler-palette-color="1"]'
      )
      .hasStyle({
        backgroundColor: 'rgb(43, 24, 39)'
      });

    assert
      .dom(
        '[data-test-kuler-palette="Monochromatic"] [data-test-kuler-palette-color="2"]'
      )
      .hasStyle({
        backgroundColor: 'rgb(94, 53, 85)'
      });

    assert
      .dom(
        '[data-test-kuler-palette="Monochromatic"] [data-test-kuler-palette-color="3"]'
      )
      .hasStyle({
        backgroundColor: 'rgb(145, 81, 131)'
      });

    assert
      .dom(
        '[data-test-kuler-palette="Monochromatic"] [data-test-kuler-palette-color="4"]'
      )
      .hasStyle({
        backgroundColor: 'rgb(196, 110, 178)'
      });
  });

  test('tetrad palette', async function (assert) {
    await fillIn('[data-test-kuler-select]', 'Tetrad');

    assert
      .dom('[data-test-kuler-palette="Tetrad"] [data-test-kuler-palette-name]')
      .hasText('Tetrad');

    assert
      .dom('[data-test-kuler-palette="Tetrad"] [data-test-kuler-palette-color]')
      .exists({ count: 4 });
  });

  test('triad palette', async function (assert) {
    await fillIn('[data-test-kuler-select]', 'Triad');

    assert
      .dom('[data-test-kuler-palette="Triad"] [data-test-kuler-palette-name]')
      .hasText('Triad');

    assert
      .dom('[data-test-kuler-palette="Triad"] [data-test-kuler-palette-color]')
      .exists({ count: 3 });

    await triggerEvent(
      '[data-test-kuler-palette="Triad"] [data-test-kuler-palette-menu]',
      'mouseenter'
    );

    await animationsSettled();

    await click(
      '[data-test-kuler-palette="Triad"] [data-test-save-kuler-palette]'
    );

    await waitForAll();

    assert.strictEqual(currentURL(), '/palettes');

    const colorsList = document.querySelector(
      '[data-test-palette-row="Triad"] .palette-color-squares'
    );

    assert
      .dom('[data-test-palette-color-square]', colorsList)
      .exists({ count: 3 });

    const thirdColor = colorsList.querySelectorAll(
      '[data-test-palette-color-square]'
    )[2];

    assert.dom(thirdColor).hasStyle({ backgroundColor: 'rgb(138, 224, 247)' });
  });

  test('changing base', async function (assert) {
    await fillIn('[data-test-kuler-select]', 'Monochromatic');

    assert
      .dom(
        '[data-test-kuler-palette="Monochromatic"] [data-test-kuler-palette-name]'
      )
      .hasText('Monochromatic');

    assert
      .dom(
        '[data-test-kuler-palette="Monochromatic"] [data-test-kuler-palette-color]'
      )
      .exists({ count: 5 });

    assert
      .dom(
        '[data-test-kuler-palette="Monochromatic"] [data-test-kuler-palette-color="0"]'
      )
      .hasStyle({
        backgroundColor: 'rgb(247, 138, 224)'
      });

    assert
      .dom(
        '[data-test-kuler-palette="Monochromatic"] [data-test-kuler-palette-color="1"]'
      )
      .hasStyle({
        backgroundColor: 'rgb(43, 24, 39)'
      });

    assert
      .dom(
        '[data-test-kuler-palette="Monochromatic"] [data-test-kuler-palette-color="2"]'
      )
      .hasStyle({
        backgroundColor: 'rgb(94, 53, 85)'
      });

    assert
      .dom(
        '[data-test-kuler-palette="Monochromatic"] [data-test-kuler-palette-color="3"]'
      )
      .hasStyle({
        backgroundColor: 'rgb(145, 81, 131)'
      });

    assert
      .dom(
        '[data-test-kuler-palette="Monochromatic"] [data-test-kuler-palette-color="4"]'
      )
      .hasStyle({
        backgroundColor: 'rgb(196, 110, 178)'
      });

    await click(
      '[data-test-kuler-palette="Monochromatic"] [data-test-kuler-palette-color="1"]'
    );
    await click('[data-test-set-base-color]');

    assert
      .dom(
        '[data-test-kuler-palette="Monochromatic"] [data-test-kuler-palette-name]'
      )
      .hasText('Monochromatic');

    assert
      .dom(
        '[data-test-kuler-palette="Monochromatic"] [data-test-kuler-palette-color]'
      )
      .exists({ count: 5 });

    assert
      .dom(
        '[data-test-kuler-palette="Monochromatic"] [data-test-kuler-palette-color="0"]'
      )
      .hasStyle({
        backgroundColor: 'rgb(43, 24, 39)'
      });

    assert
      .dom(
        '[data-test-kuler-palette="Monochromatic"] [data-test-kuler-palette-color="1"]'
      )
      .hasStyle({
        backgroundColor: 'rgb(94, 52, 85)'
      });

    assert
      .dom(
        '[data-test-kuler-palette="Monochromatic"] [data-test-kuler-palette-color="2"]'
      )
      .hasStyle({
        backgroundColor: 'rgb(145, 81, 132)'
      });

    assert
      .dom(
        '[data-test-kuler-palette="Monochromatic"] [data-test-kuler-palette-color="3"]'
      )
      .hasStyle({
        backgroundColor: 'rgb(196, 109, 178)'
      });

    assert
      .dom(
        '[data-test-kuler-palette="Monochromatic"] [data-test-kuler-palette-color="4"]'
      )
      .hasStyle({
        backgroundColor: 'rgb(247, 138, 224)'
      });
  });

  module('inputs', function () {
    test('hex input updates rgba', async function (assert) {
      assert.dom('[data-test-kuler-hex]').hasValue('#f78ae0');
      assert.dom('[data-test-kuler-r]').hasValue('247');
      assert.dom('[data-test-kuler-g]').hasValue('138');
      assert.dom('[data-test-kuler-b]').hasValue('224');
      assert.dom('[data-test-kuler-a]').hasValue('1');

      await fillIn('[data-test-kuler-hex]', '#ffffff0e');
      await triggerEvent('[data-test-kuler-hex]', 'complete');

      await waitForAll();

      assert.dom('[data-test-kuler-hex]').hasValue('#ffffff0e');
      assert.dom('[data-test-kuler-r]').hasValue('255');
      assert.dom('[data-test-kuler-g]').hasValue('255');
      assert.dom('[data-test-kuler-b]').hasValue('255');
      assert.dom('[data-test-kuler-a]').hasValue('0.05');
    });
  });

  module('red', function () {
    test('incomplete clears input', async function (assert) {
      assert.dom('[data-test-kuler-r]').hasValue('247');

      await fillIn('[data-test-kuler-r]', '255');
      await triggerEvent('[data-test-kuler-r]', 'complete');
      await fillIn('[data-test-kuler-r]', '');
      await blur('[data-test-kuler-r]');

      assert.dom('[data-test-kuler-r]').hasValue('255');
    });

    test('values capped at 255', async function (assert) {
      assert.dom('[data-test-kuler-r]').hasValue('247');

      await fillIn('[data-test-kuler-r]', '400');
      await triggerEvent('[data-test-kuler-r]', 'complete');
      await blur('[data-test-kuler-r]');

      assert.dom('[data-test-kuler-r]').hasValue('255');
    });
  });

  module('green', function () {
    test('incomplete clears input', async function (assert) {
      assert.dom('[data-test-kuler-g]').hasValue('138');

      await fillIn('[data-test-kuler-g]', '255');
      await triggerEvent('[data-test-kuler-g]', 'complete');
      await fillIn('[data-test-kuler-g]', '');
      await blur('[data-test-kuler-g]');

      assert.dom('[data-test-kuler-g]').hasValue('255');
    });

    test('values capped at 255', async function (assert) {
      assert.dom('[data-test-kuler-g]').hasValue('138');

      await fillIn('[data-test-kuler-g]', '400');
      await triggerEvent('[data-test-kuler-g]', 'complete');
      await blur('[data-test-kuler-g]');

      assert.dom('[data-test-kuler-g]').hasValue('255');
    });
  });

  module('blue', function () {
    test('incomplete clears input', async function (assert) {
      assert.dom('[data-test-kuler-b]').hasValue('224');

      await fillIn('[data-test-kuler-b]', '255');
      await triggerEvent('[data-test-kuler-b]', 'complete');
      await fillIn('[data-test-kuler-b]', '');
      await blur('[data-test-kuler-b]');

      assert.dom('[data-test-kuler-b]').hasValue('255');
    });

    test('values capped at 255', async function (assert) {
      assert.dom('[data-test-kuler-b]').hasValue('224');

      await fillIn('[data-test-kuler-b]', '400');
      await triggerEvent('[data-test-kuler-b]', 'complete');
      await blur('[data-test-kuler-b]');

      assert.dom('[data-test-kuler-b]').hasValue('255');
    });
  });

  module('alpha', function () {
    test('incomplete clears input', async function (assert) {
      assert.dom('[data-test-kuler-a]').hasValue('1');

      await fillIn('[data-test-kuler-a]', '0.52');
      await triggerEvent('[data-test-kuler-a]', 'complete');
      await fillIn('[data-test-kuler-a]', '');
      await blur('[data-test-kuler-a]');

      assert.dom('[data-test-kuler-a]').hasValue('0.52');
    });

    test('values capped at 1', async function (assert) {
      assert.dom('[data-test-kuler-a]').hasValue('1');

      await fillIn('[data-test-kuler-a]', '1.50');
      await triggerEvent('[data-test-kuler-a]', 'complete');
      await blur('[data-test-kuler-a]');

      assert.dom('[data-test-kuler-a]').hasValue('1');
    });
  });
});

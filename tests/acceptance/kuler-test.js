import { module, test } from 'qunit';
import { click, visit, currentURL, triggerEvent } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import seedOrbit from '../orbit/seed';
import { animationsSettled } from 'ember-animated/test-support';
import { waitForAll } from '../helpers';
import { selectChoose } from 'ember-power-select/test-support';

module('Acceptance | kuler', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(async function () {
    await seedOrbit(this.owner);

    await visit('/kuler?colorId=pale-magenta');
  });

  test('visiting /kuler with query parameters', function (assert) {
    assert.equal(currentURL(), '/kuler?colorId=pale-magenta');
  });

  test('analogous palette', async function (assert) {
    await selectChoose('[data-test-kuler-select]', 'Analogous');

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
    await selectChoose('[data-test-kuler-select]', 'Monochromatic');

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
    await selectChoose('[data-test-kuler-select]', 'Tetrad');

    assert
      .dom('[data-test-kuler-palette="Tetrad"] [data-test-kuler-palette-name]')
      .hasText('Tetrad');

    assert
      .dom('[data-test-kuler-palette="Tetrad"] [data-test-kuler-palette-color]')
      .exists({ count: 4 });
  });

  test('triad palette', async function (assert) {
    await selectChoose('[data-test-kuler-select]', 'Triad');

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

    assert.equal(currentURL(), '/palettes');

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
});

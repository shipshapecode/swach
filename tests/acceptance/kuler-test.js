import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import sharedScenario from '../../mirage/scenarios/shared';

module('Acceptance | kuler', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function() {
    sharedScenario(this.server);

    await visit('/kuler?colorId=color-1');
  });

  test('visiting /kuler with query parameters', function(assert) {
    assert.equal(currentURL(), '/kuler?colorId=color-1');
  });

  test('analogous palette', async function(assert) {
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

  test('monochromatic palette', async function(assert) {
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

  test('tetrad palette', async function(assert) {
    assert
    .dom(
      '[data-test-kuler-palette="Tetrad"] [data-test-kuler-palette-name]'
    )
    .hasText('Tetrad');

    assert
      .dom('[data-test-kuler-palette="Tetrad"] [data-test-kuler-palette-color]')
      .exists({ count: 4 });
  });

  test('triad palette', async function(assert) {
    assert
    .dom(
      '[data-test-kuler-palette="Triad"] [data-test-kuler-palette-name]'
    )
    .hasText('Triad');

    assert
      .dom('[data-test-kuler-palette="Triad"] [data-test-kuler-palette-color]')
      .exists({ count: 3 });
  });
});

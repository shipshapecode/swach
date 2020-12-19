import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { click, render, triggerEvent } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { waitForAll } from 'swach/tests/helpers';

module('Integration | Component | palette-row', function (hooks) {
  setupRenderingTest(hooks);

  test('delete requires confirm', async function (assert) {
    this.set('palette', {
      colorOrder: [],
      isLocked: false,
      name: 'Test Palette'
    });
    this.set('moveColorsBetweenPalettes', () => {
      /* Intentionally empty */
    });

    await render(
      hbs`<PaletteRow @palette={{this.palette}} @moveColorsBetweenPalettes={{this.moveColorsBetweenPalettes}}/>`
    );

    await waitForAll();

    await triggerEvent(
      '[data-test-palette-row="Test Palette"] [data-test-palette-row-menu]',
      'mouseenter'
    );

    await waitForAll();

    assert
      .dom(
        '[data-test-palette-row="Test Palette"] [data-test-delete-palette] svg'
      )
      .doesNotHaveClass('delete-confirm');

    await click(
      '[data-test-palette-row="Test Palette"] [data-test-delete-palette]'
    );

    await waitForAll();

    assert
      .dom(
        '[data-test-palette-row="Test Palette"] [data-test-delete-palette] svg'
      )
      .hasClass('delete-confirm');
  });
});

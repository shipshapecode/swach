import {
  blur,
  click,
  currentURL,
  fillIn,
  find,
  findAll,
  triggerEvent,
  visit
} from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { module, test } from 'qunit';

import { animationsSettled } from 'ember-animated/test-support';
import { move, sort } from 'ember-drag-sort/utils/trigger';

import { waitForAll } from 'swach/tests/helpers';
import seedOrbit from 'swach/tests/orbit/seed';

module('Acceptance | palettes', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(async function () {
    await seedOrbit(this.owner);
  });

  test('visiting /palettes', async function (assert) {
    await visit('/palettes');

    assert.equal(currentURL(), '/palettes');
    assert.dom('[data-test-palette-row]').exists({ count: 3 });
  });

  module('options menu', function () {
    test('options enabled when palette is not locked', async function (assert) {
      await visit('/palettes');

      assert
        .dom(
          '[data-test-palette-row="First Palette"] [data-test-palette-row-menu] [data-test-options-content]'
        )
        .isNotVisible();

      await click(
        '[data-test-palette-row="First Palette"] [data-test-palette-row-menu] [data-test-options-trigger]'
      );
      await waitForAll();

      assert
        .dom(
          '[data-test-palette-row="First Palette"] [data-test-palette-row-menu] [data-test-options-content]'
        )
        .isVisible();

      assert
        .dom(
          '[data-test-palette-row="First Palette"] [data-test-palette-row-menu] [data-test-options-content] [data-test-menu-item="Delete Palette"]'
        )
        .hasNoAttribute('disabled');

      assert
        .dom(
          '[data-test-palette-row="First Palette"] [data-test-palette-row-menu] [data-test-options-content] [data-test-menu-item="Duplicate Palette"]'
        )
        .hasNoAttribute('disabled');
    });

    test('options disabled when palette is locked', async function (assert) {
      await visit('/palettes');

      assert
        .dom(
          '[data-test-palette-row="Locked Palette"] [data-test-palette-row-menu] [data-test-options-content]'
        )
        .isNotVisible();

      await click(
        '[data-test-palette-row="Locked Palette"] [data-test-palette-row-menu] [data-test-options-trigger]'
      );
      await waitForAll();

      assert
        .dom(
          '[data-test-palette-row="Locked Palette"] [data-test-palette-row-menu] [data-test-options-content]'
        )
        .isVisible();

      assert
        .dom(
          '[data-test-palette-row="Locked Palette"] [data-test-palette-row-menu] [data-test-options-content] [data-test-menu-item="Delete Palette"]'
        )
        .hasAttribute('disabled');

      assert
        .dom(
          '[data-test-palette-row="Locked Palette"] [data-test-palette-row-menu] [data-test-options-content] [data-test-menu-item="Duplicate Palette"]'
        )
        .hasAttribute('disabled');
    });

    test('rename palette', async function (assert) {
      await visit('/palettes');

      await click(
        '[data-test-palette-row="First Palette"] [data-test-palette-row-menu] [data-test-options-trigger]'
      );

      await waitForAll();

      await click(
        '[data-test-palette-row="First Palette"] [data-test-palette-row-menu] [data-test-options-content] [data-test-menu-item="Rename Palette"]'
      );

      await fillIn(
        '[data-test-palette-row="First Palette"] [data-test-palette-name-input]',
        'First Palette 123'
      );

      await blur(
        '[data-test-palette-row="First Palette 123"] [data-test-palette-name-input]'
      );

      await waitForAll();

      assert
        .dom(
          '[data-test-palette-row="First Palette 123"] [data-test-palette-name]'
        )
        .hasText('First Palette 123');
    });
  });

  module('drag/drop colors', function () {
    test('rearranging colors in palette', async function (assert) {
      await visit('/palettes');

      let sourceList = find(
        '[data-test-palette-row="Second Palette"]'
      ).querySelector('.palette-color-squares');
      let firstColor = sourceList.querySelector(
        '[data-test-palette-color-square]'
      );
      assert.dom(firstColor).hasStyle({ backgroundColor: 'rgb(0, 0, 0)' });

      await sort(sourceList, 0, 1, true);

      await waitForAll();

      sourceList = find(
        '[data-test-palette-row="Second Palette"]'
      ).querySelector('.palette-color-squares');
      firstColor = sourceList.querySelector('[data-test-palette-color-square]');
      assert
        .dom(firstColor)
        .hasStyle({ backgroundColor: 'rgb(255, 255, 255)' });
    });

    test('locked palette does not allow rearranging colors', async function (assert) {
      await visit('/palettes');

      let sourceList = find(
        '[data-test-palette-row="Locked Palette"]'
      ).querySelector('.palette-color-squares');
      let firstColor = sourceList.querySelector(
        '[data-test-palette-color-square]'
      );
      assert.dom(firstColor).hasStyle({ backgroundColor: 'rgb(0, 0, 0)' });

      await sort(sourceList, 0, 1, true);

      await waitForAll();

      sourceList = find(
        '[data-test-palette-row="Locked Palette"]'
      ).querySelector('.palette-color-squares');
      firstColor = sourceList.querySelector('[data-test-palette-color-square]');
      assert.dom(firstColor).hasStyle({ backgroundColor: 'rgb(0, 0, 0)' });
    });

    test('moving colors between palettes', async function (assert) {
      await visit('/palettes');

      let targetList = find(
        '[data-test-palette-row="Second Palette"]'
      ).querySelector('.palette-color-squares');
      let sourceList = find(
        '[data-test-palette-row="First Palette"]'
      ).querySelector('.palette-color-squares');
      let sourceListThirdColor = sourceList.querySelectorAll(
        '[data-test-palette-color-square]'
      )[2];
      assert
        .dom('[data-test-palette-color-square]', sourceList)
        .exists({ count: 4 });
      assert
        .dom('[data-test-palette-color-square]', targetList)
        .exists({ count: 2 });
      assert
        .dom(sourceListThirdColor)
        .hasStyle({ backgroundColor: 'rgb(176, 245, 102)' });

      await move(sourceList, 2, targetList, 1, false);

      await waitForAll();

      targetList = find(
        '[data-test-palette-row="Second Palette"]'
      ).querySelector('.palette-color-squares');
      sourceList = find(
        '[data-test-palette-row="First Palette"]'
      ).querySelector('.palette-color-squares');
      let targetListThirdColor = targetList.querySelectorAll(
        '[data-test-palette-color-square]'
      )[2];
      assert
        .dom('[data-test-palette-color-square]', sourceList)
        .exists({ count: 3 });
      assert
        .dom('[data-test-palette-color-square]', targetList)
        .exists({ count: 3 });
      assert
        .dom(targetListThirdColor)
        .hasStyle({ backgroundColor: 'rgb(176, 245, 102)' });
    });

    test('copy color from color history to palette and edit', async function (assert) {
      await visit('/palettes');

      let sourceList = find('[data-test-color-history]');
      let sourceListThirdColor = sourceList.querySelectorAll(
        '[data-test-color-history-square]'
      )[2];
      assert
        .dom('[data-test-color-history-square]', sourceList)
        .exists({ count: 4 });

      let targetList = find(
        '[data-test-palette-row="Second Palette"]'
      ).querySelector('.palette-color-squares');
      assert
        .dom('[data-test-palette-color-square]', targetList)
        .exists({ count: 2 });
      assert
        .dom(sourceListThirdColor)
        .hasStyle({ backgroundColor: 'rgb(247, 138, 224)' });

      await move(sourceList, 2, targetList, 1, false);

      await waitForAll();

      targetList = find(
        '[data-test-palette-row="Second Palette"]'
      ).querySelector('.palette-color-squares');
      sourceList = find('[data-test-color-history]');
      let targetListThirdColor = targetList.querySelectorAll(
        '[data-test-palette-color-square]'
      )[2];
      // Count in colors list does not change when a color is copied out
      assert
        .dom('[data-test-color-history-square]', sourceList)
        .exists({ count: 4 });
      assert
        .dom('[data-test-palette-color-square]', targetList)
        .exists({ count: 3 });
      assert
        .dom(targetListThirdColor)
        .hasStyle({ backgroundColor: 'rgb(247, 138, 224)' });

      // Go to the second palette colors list and edit the third color
      await visit('/colors?paletteId=second-palette');
      assert.dom('[data-test-color]').exists({ count: 3 });
      assert.dom('[data-test-color-picker]').doesNotExist();

      await click(
        '[data-test-color="Pale Magenta"] [data-test-color-row-menu] [data-test-options-trigger]'
      );

      await animationsSettled();

      await click('[data-test-color="Pale Magenta"] [data-test-edit-color]');

      await waitForAll();

      assert.dom('[data-test-color-picker]').exists();

      await fillIn('[data-test-color-picker-r]', '255');
      await waitForAll();
      await triggerEvent('[data-test-color-picker-r]', 'complete');
      await fillIn('[data-test-color-picker-g]', '0');
      await waitForAll();
      await triggerEvent('[data-test-color-picker-g]', 'complete');
      await fillIn('[data-test-color-picker-b]', '0');
      await waitForAll();
      await triggerEvent('[data-test-color-picker-b]', 'complete');

      await waitForAll();

      await click('[data-test-color-picker-save]');

      await waitForAll();

      await visit('/palettes');
      await waitForAll();

      // No new colors should be added to color history
      assert
        .dom('[data-test-color-history] [data-test-color-history-square]')
        .exists({ count: 4 });

      // Pale Magenta should remain in color history and should be replaced with Red in Second Palette
      assert
        .dom(
          '[data-test-color-history] [data-test-color-history-square="Pale Magenta"]'
        )
        .exists();
      assert
        .dom(
          '[data-test-palette-row="Second Palette"] [data-test-palette-color-square="Red"]'
        )
        .exists();
      assert
        .dom(
          '[data-test-palette-row="Second Palette"] [data-test-palette-color-square="Pale Magenta"]'
        )
        .doesNotExist();
    });

    test('locked palette does not allow moving colors in', async function (assert) {
      await visit('/palettes');

      let targetList = find(
        '[data-test-palette-row="Locked Palette"]'
      ).querySelector('.palette-color-squares');
      let sourceList = find(
        '[data-test-palette-row="First Palette"]'
      ).querySelector('.palette-color-squares');
      let sourceListThirdColor = sourceList.querySelectorAll(
        '[data-test-palette-color-square]'
      )[2];
      assert
        .dom('[data-test-palette-color-square]', sourceList)
        .exists({ count: 4 });
      assert
        .dom('[data-test-palette-color-square]', targetList)
        .exists({ count: 3 });
      assert
        .dom(sourceListThirdColor)
        .hasStyle({ backgroundColor: 'rgb(176, 245, 102)' });

      await move(sourceList, 2, targetList, 1, false);

      await waitForAll();

      targetList = find(
        '[data-test-palette-row="Locked Palette"]'
      ).querySelector('.palette-color-squares');
      sourceList = find(
        '[data-test-palette-row="First Palette"]'
      ).querySelector('.palette-color-squares');
      let targetListThirdColor = targetList.querySelectorAll(
        '[data-test-palette-color-square]'
      )[2];
      assert
        .dom('[data-test-palette-color-square]', sourceList)
        .exists({ count: 4 });
      assert
        .dom('[data-test-palette-color-square]', targetList)
        .exists({ count: 3 });
      assert
        .dom(targetListThirdColor)
        .hasStyle({ backgroundColor: 'rgb(255, 255, 255)' });
    });

    test('locked palette does not allow moving colors out', async function (assert) {
      await visit('/palettes');

      let targetList = find(
        '[data-test-palette-row="First Palette"]'
      ).querySelector('.palette-color-squares');
      let sourceList = find(
        '[data-test-palette-row="Locked Palette"]'
      ).querySelector('.palette-color-squares');
      let sourceListThirdColor = sourceList.querySelectorAll(
        '[data-test-palette-color-square]'
      )[2];
      assert
        .dom('[data-test-palette-color-square]', sourceList)
        .exists({ count: 3 });
      assert
        .dom('[data-test-palette-color-square]', targetList)
        .exists({ count: 4 });
      assert
        .dom(sourceListThirdColor)
        .hasStyle({ backgroundColor: 'rgb(255, 255, 255)' });

      await move(sourceList, 2, targetList, 1, false);

      await waitForAll();

      targetList = find(
        '[data-test-palette-row="First Palette"]'
      ).querySelector('.palette-color-squares');
      sourceList = find(
        '[data-test-palette-row="Locked Palette"]'
      ).querySelector('.palette-color-squares');
      let targetListThirdColor = targetList.querySelectorAll(
        '[data-test-palette-color-square]'
      )[2];
      assert
        .dom('[data-test-palette-color-square]', sourceList)
        .exists({ count: 3 });
      assert
        .dom('[data-test-palette-color-square]', targetList)
        .exists({ count: 4 });
      assert
        .dom(targetListThirdColor)
        .hasStyle({ backgroundColor: 'rgb(176, 245, 102)' });
    });
  });

  test('clear color history', async function (assert) {
    await visit('/palettes');

    assert
      .dom('[data-test-color-history] [data-test-color-history-square]')
      .exists({ count: 4 });

    await click('[data-test-color-history-menu] [data-test-options-trigger]');
    await waitForAll();
    await click(
      '[data-test-color-history-menu] [data-test-options-content] [data-test-clear-color-history]'
    );
    await waitForAll();

    assert
      .dom('[data-test-color-history] [data-test-color-history-square]')
      .exists({ count: 0 });
  });

  // Ember specific tests
  if (typeof requireNode === 'undefined') {
    test('creating palettes and undo / redo', async function (assert) {
      await visit('/palettes');

      assert.dom('[data-test-palette-row]').exists({ count: 3 });

      await click('[data-test-create-palette]');

      await waitForAll();

      assert.dom('[data-test-palette-row]').exists({ count: 4 });

      await triggerEvent(document.body, 'keydown', {
        keyCode: 90,
        ctrlKey: true
      });
      await waitForAll();

      assert.dom('[data-test-palette-row]').exists({ count: 3 });

      await triggerEvent(document.body, 'keydown', {
        keyCode: 90,
        ctrlKey: true,
        shiftKey: true
      });
      await waitForAll();

      assert.dom('[data-test-palette-row]').exists({ count: 4 });
    });

    test('duplicate palette and undo / redo', async function (assert) {
      await visit('/palettes');

      await click(
        '[data-test-palette-row="First Palette"] [data-test-palette-row-menu] [data-test-options-trigger]'
      );
      await waitForAll();

      await click(
        '[data-test-palette-row="First Palette"] [data-test-palette-row-menu] [data-test-options-content] [data-test-menu-item="Duplicate Palette"]'
      );

      await waitForAll();

      assert
        .dom('[data-test-palette-row="First Palette"]')
        .exists({ count: 2 });

      const duplicatedPalettes = await findAll(
        '[data-test-palette-row="First Palette"]'
      );
      const firstPaletteColors = duplicatedPalettes[0].querySelectorAll(
        '[data-test-palette-color-square]'
      );
      const duplicatedPaletteColors = duplicatedPalettes[1].querySelectorAll(
        '[data-test-palette-color-square]'
      );

      assert
        .dom('[data-test-palette-color-square]', duplicatedPalettes[0])
        .exists({ count: 4 });
      assert
        .dom('[data-test-palette-color-square]', duplicatedPalettes[1])
        .exists({ count: 4 });

      assert
        .dom(firstPaletteColors[0])
        .hasStyle({ backgroundColor: 'rgb(0, 0, 0)' });
      assert
        .dom(firstPaletteColors[1])
        .hasStyle({ backgroundColor: 'rgb(53, 109, 196)' });
      assert
        .dom(firstPaletteColors[2])
        .hasStyle({ backgroundColor: 'rgb(176, 245, 102)' });
      assert
        .dom(firstPaletteColors[3])
        .hasStyle({ backgroundColor: 'rgb(255, 255, 255)' });

      assert
        .dom(duplicatedPaletteColors[0])
        .hasStyle({ backgroundColor: 'rgb(0, 0, 0)' });
      assert
        .dom(duplicatedPaletteColors[1])
        .hasStyle({ backgroundColor: 'rgb(53, 109, 196)' });
      assert
        .dom(duplicatedPaletteColors[2])
        .hasStyle({ backgroundColor: 'rgb(176, 245, 102)' });
      assert
        .dom(duplicatedPaletteColors[3])
        .hasStyle({ backgroundColor: 'rgb(255, 255, 255)' });

      await triggerEvent(document.body, 'keydown', {
        keyCode: 90,
        ctrlKey: true
      });
      await waitForAll();

      assert
        .dom('[data-test-palette-row="First Palette"]')
        .exists({ count: 1 });
    });

    test('undo/redo - rearranging colors in palette', async function (assert) {
      await visit('/palettes');

      let sourceList = find(
        '[data-test-palette-row="Second Palette"]'
      ).querySelector('.palette-color-squares');
      let firstColor = sourceList.querySelector(
        '[data-test-palette-color-square]'
      );
      assert.dom(firstColor).hasStyle({ backgroundColor: 'rgb(0, 0, 0)' });

      await sort(sourceList, 0, 1, true);

      await waitForAll();

      sourceList = find(
        '[data-test-palette-row="Second Palette"]'
      ).querySelector('.palette-color-squares');
      firstColor = sourceList.querySelector('[data-test-palette-color-square]');
      assert
        .dom(firstColor)
        .hasStyle({ backgroundColor: 'rgb(255, 255, 255)' });

      await triggerEvent(document.body, 'keydown', {
        keyCode: 90,
        ctrlKey: true
      });

      await waitForAll();

      sourceList = find(
        '[data-test-palette-row="Second Palette"]'
      ).querySelector('.palette-color-squares');
      firstColor = sourceList.querySelector('[data-test-palette-color-square]');
      assert.dom(firstColor).hasStyle({ backgroundColor: 'rgb(0, 0, 0)' });

      await triggerEvent(document.body, 'keydown', {
        keyCode: 90,
        ctrlKey: true,
        shiftKey: true
      });

      await waitForAll();

      sourceList = find(
        '[data-test-palette-row="Second Palette"]'
      ).querySelector('.palette-color-squares');
      firstColor = sourceList.querySelector('[data-test-palette-color-square]');
      assert
        .dom(firstColor)
        .hasStyle({ backgroundColor: 'rgb(255, 255, 255)' });
    });
  }
});

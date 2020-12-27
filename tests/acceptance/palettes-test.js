import {
  blur,
  click,
  currentURL,
  fillIn,
  find,
  triggerEvent,
  visit
} from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { module, test } from 'qunit';

import { move, sort } from 'ember-drag-sort/utils/trigger';

import { triggerContextMenu, waitForAll } from 'swach/tests/helpers';
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

  module('context menu', function () {
    test('context menu can be triggered', async function (assert) {
      await visit('/palettes');

      assert
        .dom(document.querySelector('[data-test-context-menu]'))
        .doesNotExist();

      triggerContextMenu('[data-test-palette-row="First Palette"]');
      await waitForAll();

      assert.dom(document.querySelector('[data-test-context-menu]')).exists();

      assert
        .dom(
          document.querySelector(
            '[data-test-context-menu-item="Delete Palette"]'
          ).parentElement
        )
        .doesNotHaveClass('context-menu__item--disabled');

      assert
        .dom(
          document.querySelector(
            '[data-test-context-menu-item="Duplicate Palette"]'
          ).parentElement
        )
        .doesNotHaveClass('context-menu__item--disabled');
    });

    test('options disabled when palette is locked', async function (assert) {
      await visit('/palettes');

      assert
        .dom(document.querySelector('[data-test-context-menu]'))
        .doesNotExist();

      triggerContextMenu('[data-test-palette-row="Locked Palette"]');
      await waitForAll();

      assert.dom(document.querySelector('[data-test-context-menu]')).exists();

      assert
        .dom(
          document.querySelector(
            '[data-test-context-menu-item="Delete Palette"]'
          ).parentElement
        )
        .hasClass('context-menu__item--disabled');

      assert
        .dom(
          document.querySelector(
            '[data-test-context-menu-item="Duplicate Palette"]'
          ).parentElement
        )
        .hasClass('context-menu__item--disabled');
    });

    test('rename palette', async function (assert) {
      await visit('/palettes');

      triggerContextMenu('[data-test-palette-row="First Palette"]');
      await waitForAll();

      await click(
        document.querySelector('[data-test-context-menu-item="Rename Palette"]')
          .parentElement
      );

      await fillIn(
        '[data-test-palette-row="First Palette"] [data-test-palette-name-input]',
        'First Palette 123'
      );

      await blur(
        '[data-test-palette-row="First Palette 123"] [data-test-palette-name-input]'
      );

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

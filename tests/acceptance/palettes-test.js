import { module, test } from 'qunit';
import {
  currentURL,
  find,
  triggerEvent,
  visit
} from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { move, sort } from 'ember-drag-sort/utils/trigger';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { triggerContextMenu } from 'ember-context-menu/test-support';
import sharedScenario from '../../mirage/scenarios/shared';
import { waitForSource } from 'ember-orbit/test-support';

module('Acceptance | palettes', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function() {
    sharedScenario(this.server);
  });

  hooks.afterEach(async function(){
    await waitForSource('mirage');
  })

  test('visiting /palettes', async function(assert) {
    await visit('/palettes');

    assert.equal(currentURL(), '/palettes');
    assert.dom('[data-test-palette-row]').exists({ count: 3 });
  });

  module('context menu', function() {
    test('context menu can be triggered', async function(assert) {
      await visit('/palettes');

      assert.notOk(
        document.querySelector('[data-test-context-menu]'),
        'context menu hidden'
      );

      triggerContextMenu('[data-test-palette-row="First Palette"]');

      assert.ok(
        document.querySelector('[data-test-context-menu]'),
        'context menu shown'
      );

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

    test('options disabled when palette is locked', async function(assert) {
      await visit('/palettes');

      assert.notOk(
        document.querySelector('[data-test-context-menu]'),
        'context menu hidden'
      );

      triggerContextMenu('[data-test-palette-row="Locked Palette"]');

      assert.ok(
        document.querySelector('[data-test-context-menu]'),
        'context menu shown'
      );

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
  });

  module('drag/drop colors', function() {
    test('rearranging colors in palette', async function(assert) {
      await visit('/palettes');

      let sourceList = find(
        '[data-test-palette-row="Second Palette"]'
      ).querySelector('.palette-color-squares');
      let firstColor = sourceList.querySelector(
        '[data-test-palette-color-square]'
      );
      assert.dom(firstColor).hasStyle({ backgroundColor: 'rgb(0, 0, 0)' });

      await sort(sourceList, 0, 1, true);

      await waitForSource('store');

      sourceList = find(
        '[data-test-palette-row="Second Palette"]'
      ).querySelector('.palette-color-squares');
      firstColor = sourceList.querySelector('[data-test-palette-color-square]');
      assert
        .dom(firstColor)
        .hasStyle({ backgroundColor: 'rgb(255, 255, 255)' });
    });

    test('undo/redo - rearranging colors in palette', async function(assert) {
      await visit('/palettes');

      let sourceList = find(
        '[data-test-palette-row="Second Palette"]'
      ).querySelector('.palette-color-squares');
      let firstColor = sourceList.querySelector(
        '[data-test-palette-color-square]'
      );
      assert.dom(firstColor).hasStyle({ backgroundColor: 'rgb(0, 0, 0)' });

      await sort(sourceList, 0, 1, true);

      await waitForSource('store');

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

      await waitForSource('store');

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

      await waitForSource('store');

      sourceList = find(
        '[data-test-palette-row="Second Palette"]'
      ).querySelector('.palette-color-squares');
      firstColor = sourceList.querySelector('[data-test-palette-color-square]');
      assert
        .dom(firstColor)
        .hasStyle({ backgroundColor: 'rgb(255, 255, 255)' });
    });

    test('locked palette does not allow rearranging colors', async function(assert) {
      await visit('/palettes');

      let sourceList = find(
        '[data-test-palette-row="Locked Palette"]'
      ).querySelector('.palette-color-squares');
      let firstColor = sourceList.querySelector(
        '[data-test-palette-color-square]'
      );
      assert.dom(firstColor).hasStyle({ backgroundColor: 'rgb(0, 0, 0)' });

      await sort(sourceList, 0, 1, true);

      await waitForSource('store');

      sourceList = find(
        '[data-test-palette-row="Locked Palette"]'
      ).querySelector('.palette-color-squares');
      firstColor = sourceList.querySelector('[data-test-palette-color-square]');
      assert.dom(firstColor).hasStyle({ backgroundColor: 'rgb(0, 0, 0)' });
    });

    test('moving colors between palettes', async function(assert) {
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

      await waitForSource('store');

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

    test('locked palette does not allow moving colors in', async function(assert) {
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

      await waitForSource('store');

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

    test('locked palette does not allow moving colors out', async function(assert) {
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
});

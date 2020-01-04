import { module, test } from 'qunit';
import { currentURL, findAll, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { move, sort } from 'ember-drag-sort/utils/trigger';
import { setupMirage } from 'ember-cli-mirage/test-support';
import sharedScenario from '../../mirage/scenarios/shared';

module('Acceptance | palettes', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(function() {
    sharedScenario(this.server);
  });

  test('visiting /palettes', async function(assert) {
    await visit('/palettes');

    assert.equal(currentURL(), '/palettes');
    assert.dom('[data-test-palette-row]').exists({ count: 2 });
  });

  module('drag/drop colors', function() {
    test('rearranging colors in palette', async function(assert) {
      await visit('/palettes');

      let palettes = findAll('[data-test-palette-row]');
      let sourceList = palettes[0].querySelector('.palette-color-squares');
      let firstColor = sourceList.querySelector(
        '[data-test-palette-color-square]'
      );
      assert.dom(firstColor).hasStyle({ backgroundColor: 'rgb(0, 0, 0)' });

      await sort(sourceList, 0, 1, true);

      palettes = findAll('[data-test-palette-row]');
      sourceList = palettes[0].querySelector('.palette-color-squares');
      firstColor = sourceList.querySelector('[data-test-palette-color-square]');
      assert
        .dom(firstColor)
        .hasStyle({ backgroundColor: 'rgb(255, 255, 255)' });
    });

    test('moving colors between palettes', async function(assert) {
      await visit('/palettes');

      let palettes = findAll('[data-test-palette-row]');
      let targetList = palettes[0].querySelector('.palette-color-squares');
      let sourceList = palettes[1].querySelector('.palette-color-squares');
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
        .hasStyle({ backgroundColor: 'rgb(53, 109, 196)' });

      await move(sourceList, 2, targetList, 1, false);

      palettes = findAll('[data-test-palette-row]');
      targetList = palettes[0].querySelector('.palette-color-squares');
      sourceList = palettes[1].querySelector('.palette-color-squares');
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
        .hasStyle({ backgroundColor: 'rgb(53, 109, 196)' });
    });
  });

  module('context menu', function() {
    test('context menu can be triggered', async function(assert) {
      await visit('/palettes');

      assert.notOk(document.querySelector('[data-test-context-menu]'), 'context menu hidden');

      const element = document.querySelector(
        '[data-test-palette-row="First Palette"]'
      ).parentElement;

      var contextMenuEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: false,
        view: window,
        button: 2,
        buttons: 0,
        clientX: element.getBoundingClientRect().x,
        clientY: element.getBoundingClientRect().y
      });

      element.dispatchEvent(contextMenuEvent);

      assert.ok(document.querySelector('[data-test-context-menu]'), 'context menu shown');
    });
  });
});

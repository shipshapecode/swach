import {
  click,
  currentURL,
  fillIn,
  triggerEvent,
  visit
} from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { module, test } from 'qunit';

import { animationsSettled } from 'ember-animated/test-support';

import { waitForAll } from 'swach/tests/helpers';
import seedOrbit from 'swach/tests/orbit/seed';

module('Acceptance | colors', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(async function () {
    await seedOrbit(this.owner);
  });

  test('visiting /colors', async function (assert) {
    await visit('/colors?paletteId=color-history-123');

    assert.strictEqual(currentURL(), '/colors?paletteId=color-history-123');

    assert.dom('[data-test-color]').exists({ count: 4 });

    assert
      .dom('[data-test-color="Black"] [data-test-color-name]')
      .hasText('Black');

    assert
      .dom('[data-test-color="Black"] [data-test-color-hex]')
      .hasText('#000000');
  });

  test('edit color - cancel', async function (assert) {
    await visit('/colors?paletteId=color-history-123');

    assert.dom('[data-test-color]').exists({ count: 4 });
    assert.dom('[data-test-color-picker]').doesNotExist();

    await click(
      '[data-test-color="Black"] [data-test-color-row-menu] [data-test-options-trigger]'
    );

    await animationsSettled();

    await click('[data-test-color="Black"] [data-test-edit-color]');

    await waitForAll();

    assert.dom('[data-test-color-picker]').exists();

    await fillIn('[data-test-color-picker-r]', '255');
    await triggerEvent('[data-test-color-picker-r]', 'complete');
    await fillIn('[data-test-color-picker-g]', '0');
    await triggerEvent('[data-test-color-picker-g]', 'complete');
    await fillIn('[data-test-color-picker-b]', '0');
    await triggerEvent('[data-test-color-picker-b]', 'complete');

    await waitForAll();

    await click('[data-test-color-picker-cancel]');

    await waitForAll();

    assert.dom('[data-test-color="Black"]').exists();
    assert.dom('[data-test-color="Red"]').doesNotExist();
  });

  test('edit color - save', async function (assert) {
    await visit('/colors?paletteId=color-history-123');

    assert.dom('[data-test-color]').exists({ count: 4 });
    assert.dom('[data-test-color-picker]').doesNotExist();

    await click(
      '[data-test-color="Black"] [data-test-color-row-menu] [data-test-options-trigger]'
    );

    await animationsSettled();

    await click('[data-test-color="Black"] [data-test-edit-color]');

    await waitForAll();

    assert.dom('[data-test-color-picker]').exists();

    await fillIn('[data-test-color-picker-r]', '255');
    await triggerEvent('[data-test-color-picker-r]', 'complete');
    await fillIn('[data-test-color-picker-g]', '0');
    await triggerEvent('[data-test-color-picker-g]', 'complete');
    await fillIn('[data-test-color-picker-b]', '0');
    await triggerEvent('[data-test-color-picker-b]', 'complete');

    await waitForAll();

    await click('[data-test-color-picker-save]');

    await waitForAll();

    assert.dom('[data-test-color="Black"]').doesNotExist();
    assert.dom('[data-test-color="Red"]').exists();
  });

  test('go to kuler', async function (assert) {
    await visit('/colors?paletteId=color-history-123');

    assert.dom('[data-test-color]').exists({ count: 4 });

    await click(
      '[data-test-color="Black"] [data-test-color-row-menu] [data-test-options-trigger]'
    );

    await animationsSettled();

    await click('[data-test-color="Black"] [data-test-go-to-kuler]');

    await waitForAll();

    assert.strictEqual(currentURL(), '/kuler?colorId=black');
  });

  // Ember specific tests
  if (typeof requireNode === 'undefined') {
    test('ember - deleting colors', async function (assert) {
      await visit('/colors?paletteId=color-history-123');

      assert.dom('[data-test-color]').exists({ count: 4 });

      await click(
        '[data-test-color="Black"] [data-test-color-row-menu] [data-test-options-trigger]'
      );

      await animationsSettled();

      await click(
        '[data-test-color="Black"] [data-test-color-row-menu] [data-test-options-content] [data-test-delete-color]'
      );

      await waitForAll();

      assert.dom('[data-test-color]').exists({ count: 3 });

      // undo
      await triggerEvent(document.body, 'keydown', {
        keyCode: 90,
        ctrlKey: true
      });

      await waitForAll();

      assert.dom('[data-test-color]').exists({ count: 4 });

      // redo
      await triggerEvent(document.body, 'keydown', {
        keyCode: 90,
        ctrlKey: true,
        shiftKey: true
      });

      await waitForAll();

      assert.dom('[data-test-color]').exists({ count: 3 });
    });
  }

  // Electron specific tests
  if (typeof requireNode !== 'undefined') {
    // TODO: We need a way to manually trigger undo and redo in Electron
    // const { ipcRenderer } = requireNode('electron');
    // eslint-disable-next-line qunit/no-commented-tests
    // test('electron - deleting colors', async function (assert) {
    //   await visit('/colors?paletteId=color-history-123');
    //   assert.dom('[data-test-color]').exists({ count: 4 });
    //   await triggerEvent(
    //     '[data-test-color="Black"] [data-test-color-row-menu]',
    //     'mouseenter'
    //   );
    //   await animationsSettled();
    //   // Click twice to confirm
    //   await click('[data-test-color="Black"] [data-test-delete-color]');
    //   await click('[data-test-color="Black"] [data-test-delete-color]');
    //   await waitForAll();
    //   assert.dom('[data-test-color]').exists({ count: 3 });
    //   // undo
    //   await ipcRenderer.sendSync('undoRedo', 'undo');
    //   await waitForAll();
    //   assert.dom('[data-test-color]').exists({ count: 4 });
    //   // redo
    //   await ipcRenderer.sendSync('undoRedo', 'redo');
    //   await waitForAll();
    //   assert.dom('[data-test-color]').exists({ count: 3 });
    // });
  }
});

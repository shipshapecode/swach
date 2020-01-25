import { module, test } from 'qunit';
import {
  click,
  visit,
  currentURL,
  triggerEvent
} from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { animationsSettled } from 'ember-animated/test-support';
import { waitForAll } from '../helpers';
import seedOrbit from '../orbit/seed';

module('Acceptance | colors', function(hooks) {
  setupApplicationTest(hooks);
  
  hooks.beforeEach(async function() {
    await seedOrbit(this.owner);
  });

  test('visiting /colors', async function(assert) {
    await visit('/colors?paletteId=color-history-123');

    assert.equal(currentURL(), '/colors?paletteId=color-history-123');

    assert.dom('[data-test-color]').exists({ count: 4 });

    assert
      .dom('[data-test-color="Black"] [data-test-color-name]')
      .hasText('Black');

    assert
      .dom('[data-test-color="Black"] [data-test-color-hex]')
      .hasText('#000000');
  });

  test('deleting colors', async function(assert) {
    await visit('/colors?paletteId=color-history-123');

    assert.dom('[data-test-color]').exists({ count: 4 });

    await triggerEvent(
      '[data-test-color="Black"] [data-test-color-row-menu]',
      'mouseenter'
    );

    await animationsSettled();

    // Click twice to confirm
    await click('[data-test-color="Black"] [data-test-delete-color]');
    await click('[data-test-color="Black"] [data-test-delete-color]');

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
});

import { module, test } from 'qunit';
import { click, visit, currentURL, settled, triggerEvent } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { animationsSettled } from 'ember-animated/test-support';
import sharedScenario from '../../mirage/scenarios/shared';
import { waitForSource } from 'ember-orbit/test-support';

module('Acceptance | colors', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function() {
    sharedScenario(this.server);
    await this.owner.lookup('service:store').source.requestQueue.process();
    await settled();
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

    debugger;
    // Click twice to confirm
    await click('[data-test-color="Black"] [data-test-delete-color]');
    await click('[data-test-color="Black"] [data-test-delete-color]');

    await animationsSettled();
    await this.owner.lookup('service:store').source.requestQueue.process();
    await settled();
    await animationsSettled();

    assert.dom('[data-test-color]').exists({ count: 3 });

    debugger;
    // undo
    await triggerEvent(document.body, 'keydown', {
      keyCode: 90,
      ctrlKey: true
    });

    await animationsSettled();
    await this.owner.lookup('service:store').source.requestQueue.process();
    await settled();
    await animationsSettled();
    await this.owner.lookup('service:store').source.requestQueue.process();
    await settled();

    debugger;

    assert.dom('[data-test-color]').exists({ count: 4 });

    // redo
    await triggerEvent(document.body, 'keydown', {
      keyCode: 90,
      ctrlKey: true,
      shiftKey: true
    });

    await this.owner.lookup('service:store').source.requestQueue.process();
    await settled();
    await animationsSettled();
    assert.dom('[data-test-color]').exists({ count: 3 });
  });
});

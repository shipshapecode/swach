import { module, test } from 'qunit';
import { click, visit, currentURL, triggerEvent } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { animationsSettled } from 'ember-animated/test-support';
import sharedScenario from '../../mirage/scenarios/shared';

module('Acceptance | colors', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(function () {
    sharedScenario(this.server);
  });

  test('visiting /colors', async function (assert) {
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

  test('deleting colors', async function (assert) {
    await visit('/colors?paletteId=color-history-123');

    assert.dom('[data-test-color]').exists({ count: 4 });

    await triggerEvent('[data-test-color="Black"] [data-test-color-row-menu]', 'mouseenter');
    // Click twice to confirm
    await click('[data-test-color="Black"] [data-test-delete-color]');
    await click('[data-test-color="Black"] [data-test-delete-color]');

    await animationsSettled();

    assert.dom('[data-test-color]').exists({ count: 3 });

    // undo
    await triggerEvent(document.querySelector('body'), 'keydown', { keyCode: 90, ctrlKey: true });
    assert.dom('[data-test-color]').exists({ count: 4 });
  });
});

import { click, fillIn, triggerEvent, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { module, test } from 'qunit';

import { resetStorage, waitForAll } from 'swach/tests/helpers';

module('Acceptance | from scratch', function (hooks) {
  setupApplicationTest(hooks);
  resetStorage(hooks);

  test('add a color', async function (assert) {
    await visit('/palettes');

    assert
      .dom('[data-test-color-history] [data-test-color-history-square]')
      .doesNotExist();

    await click('[data-test-toggle-color-picker]');

    await waitForAll();

    await fillIn('[data-test-color-picker-hex]', '#ffffff0e');
    await triggerEvent('[data-test-color-picker-hex]', 'complete');

    await waitForAll();

    await click('[data-test-color-picker-save]');

    await waitForAll();

    assert
      .dom('[data-test-color-history] [data-test-color-history-square]')
      .exists({ count: 1 });
  });
});

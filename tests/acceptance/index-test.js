import { currentURL, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';

import { resetStorage, waitForAll } from '../helpers';
import { setupApplicationTest } from '../helpers/index';

module('Acceptance | index', function (hooks) {
  setupApplicationTest(hooks);
  resetStorage(hooks, { seed: { source: 'backup', scenario: 'basic' } });

  test('visiting /index', async function (assert) {
    await visit('/');
    await waitForAll();

    assert.strictEqual(currentURL(), '/palettes');
  });
});

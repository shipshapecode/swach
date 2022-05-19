import { currentURL, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';

import { resetStorage } from 'swach/tests/helpers';
import { setupApplicationTest } from 'swach/tests/helpers/index';

module('Acceptance | index', function (hooks) {
  setupApplicationTest(hooks);
  resetStorage(hooks, { seed: { source: 'backup', scenario: 'basic' } });

  test('visiting /index', async function (assert) {
    await visit('/');

    assert.strictEqual(currentURL(), '/palettes');
  });
});

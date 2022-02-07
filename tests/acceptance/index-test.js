import { currentURL, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { module, test } from 'qunit';

import { resetStorage } from 'swach/tests/helpers';

module('Acceptance | index', function (hooks) {
  setupApplicationTest(hooks);
  resetStorage(hooks, { seed: { source: 'backup', scenario: 'basic' } });

  test('visiting /index', async function (assert) {
    await visit('/');

    assert.strictEqual(currentURL(), '/palettes');
  });
});

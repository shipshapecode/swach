import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import resetStorages from 'ember-local-storage/test-support/reset-storage';
import seedOrbit from '../../orbit/seed';

module('Acceptance | settings/data', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(async function () {
    await seedOrbit(this.owner);
    await visit('/settings');
  });

  hooks.afterEach(function () {
    resetStorages();
  });

  test('visiting /settings/data', async function (assert) {
    await visit('/settings/data');

    assert.equal(currentURL(), '/settings/data');
  });
});

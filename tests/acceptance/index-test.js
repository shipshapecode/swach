import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import seedOrbit from '../orbit/seed';

module('Acceptance | index', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(async function () {
    await seedOrbit(this.owner);
  });

  test('visiting /index', async function (assert) {
    await visit('/');

    assert.equal(currentURL(), '/palettes');
  });
});

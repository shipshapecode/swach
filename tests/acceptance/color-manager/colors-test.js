import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';

module('Acceptance | color manager/colors', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(function() {
    this.server.loadFixtures();
  });

  test('visiting /colors', async function(assert) {
    await visit('/colors');

    assert.equal(currentURL(), '/colors');
  });
});

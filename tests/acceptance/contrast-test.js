import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import sharedScenario from '../../mirage/scenarios/shared';

module('Acceptance | contrast', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(function() {
    sharedScenario(this.server);
  });

  test('visiting /contrast', async function(assert) {
    await visit('/contrast');

    assert.equal(currentURL(), '/contrast');
  });
});

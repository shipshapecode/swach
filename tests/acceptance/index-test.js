import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import sharedScenario from '../../mirage/scenarios/shared';

module('Acceptance | index', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function() {
    sharedScenario(this.server);
  });

  test('visiting /index', async function(assert) {
    await visit('/');

    assert.equal(currentURL(), '/palettes');
  });
});

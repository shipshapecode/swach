import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import sharedScenario from '../../../mirage/scenarios/shared';

module('Acceptance | color manager/palettes', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(function() {
    sharedScenario(this.server);
  });

  test('visiting /palettes', async function(assert) {
    await visit('/palettes');

    assert.equal(currentURL(), '/palettes');
  });
});

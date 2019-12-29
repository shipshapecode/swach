import { module, test } from 'qunit';
import { fillIn, visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import sharedScenario from '../../mirage/scenarios/shared';

module('Acceptance | contrast', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function() {
    sharedScenario(this.server);
    await visit('/contrast');
  });

  test('visiting /contrast', async function(assert) {
    assert.equal(currentURL(), '/contrast');
  });

  test('has default value on open', function(assert) {
    assert.dom('[data-test-wcag-score]').hasText('21.00');
    assert.dom('[data-test-wcag-string]').hasText('AAA');
  });

  test('updates score when failing background value added', async function(assert) {
    await fillIn('.pcr-result', '#504F4F');

    assert.dom('[data-test-wcag-score]').hasText('2.57');
    assert.dom('[data-test-wcag-string]').hasText('Fail');
  });
});

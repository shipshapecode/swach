import { module, test } from 'qunit';
import { fillIn, find, visit, currentURL } from '@ember/test-helpers';
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

  test('has default value on open', async function(assert) {
    const score = await find('[data-test-wcag-score]');
    const text = await find('[data-test-wcag-string]');

    assert.equal(text.textContent.trim(), 'AAA');
    assert.equal(score.textContent.trim(), '21.00');
  });

  test('updates score when failing background value added', async function(assert) {
    const score = await find('[data-test-wcag-score]');
    const text = await find('[data-test-wcag-string]');
    await fillIn('.pcr-result', '#504F4F');

    assert.equal(text.textContent.trim(), 'Fail');
    assert.equal(score.textContent.trim(), '2.57');
  });
});

import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import sharedScenario from '../../mirage/scenarios/shared';

module('Acceptance | kuler', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function() {
    sharedScenario(this.server);

    await visit('/kuler?colorId=color-1');
  });

  test('visiting /kuler with query parameters', function(assert) {
    assert.equal(currentURL(), '/kuler?colorId=color-1');
  });

  test('shows all color harmonies', async function(assert) {
    assert.dom('[data-test-kuler-palette-options]').exists({ count: 17 });
    assert.dom('[data-test-kuler-palette]').exists();
  });
});

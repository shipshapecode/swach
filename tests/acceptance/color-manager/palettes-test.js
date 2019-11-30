import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';

module('Acceptance | color manager/palettes', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  test('visiting /palettes', async function(assert) {
    await visit('/palettes');

    assert.equal(currentURL(), '/palettes');
  });
});

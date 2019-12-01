import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';

module('Acceptance | color manager/colors', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  test('visiting /colors', async function(assert) {
    await visit('/colors');

    assert.equal(currentURL(), '/colors');

    assert.dom('[data-test-color]').exists({ count: 4 });

    assert
      .dom('[data-test-color="Black"] [data-test-color-name]')
      .hasText('Black');

    assert
      .dom('[data-test-color="Black"] [data-test-color-hex]')
      .hasText('#000000');
  });
});

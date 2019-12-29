import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import sharedScenario from '../../mirage/scenarios/shared';
import { selectChoose } from 'ember-power-select/test-support';

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

  test('shows selected color and gives dropdown complimentary options', function(assert) {
    assert.dom('[data-test-color]').exists();
    assert.dom('[data-test-kuler-options]').exists();
    assert.dom('[data-test-kuler-palette]').doesNotExist();
    assert.dom('.ember-power-select-selected-item').doesNotExist();
  });

  test('selecting analogous gives 5 recommendations', async function(assert) {
    await selectChoose('[data-test-kuler-options]', 'Analogous');

    assert.dom('[data-test-kuler-palette-options]').exists({ count: 5 });
    assert.dom('[data-test-kuler-palette]').exists();
    assert.dom('.ember-power-select-selected-item').hasText('Analogous');
  });

  test('selecting monochromatic gives 5 recommendations', async function(assert) {
    await selectChoose('[data-test-kuler-options]', 'Monochromatic');

    assert.dom('[data-test-kuler-palette-options]').exists({ count: 5 });
    assert.dom('[data-test-kuler-palette]').exists();
    assert.dom('.ember-power-select-selected-item').hasText('Monochromatic');
  });

  test('selecting tetrad gives 4 recommendations', async function(assert) {
    await selectChoose('[data-test-kuler-options]', 'Tetrad');

    assert.dom('[data-test-kuler-palette-options]').exists({ count: 4 });
    assert.dom('[data-test-kuler-palette]').exists();
    assert.dom('.ember-power-select-selected-item').hasText('Tetrad');
  });

  test('selecting triad gives 3 recommendations', async function(assert) {
    await selectChoose('[data-test-kuler-options]', 'Triad');

    assert.dom('[data-test-kuler-palette-options]').exists({ count: 3 });
    assert.dom('[data-test-kuler-palette]').exists();
    assert.dom('.ember-power-select-selected-item').hasText('Triad');
  });
});

import { module, test } from 'qunit';
import { find, findAll, visit, currentURL } from '@ember/test-helpers';
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

  test('visiting /kuler with query parameters', async function(assert) {
    assert.equal(currentURL(), '/kuler?colorId=color-1');
  });

  test('shows selected color and gives dropdown complimentary options', async function(assert) {
    const color = await find('[data-test-color]');
    const options = await find('[data-test-kuler-options]');
    const palette = await find('[data-test-kuler-palette]');
    const selected = await find('.ember-power-select-selected-item');

    assert.ok(color, 'Selected color is shown for the base');
    assert.ok(options, 'There are options, but none selected');
    assert.notOk(selected, 'None are selected');
    assert.notOk(palette, 'Does not show on default');
  });

  test('selecting analogous gives 5 recommendations', async function(assert) {
    await selectChoose('[data-test-kuler-options]', 'Analogous');
    const options = await findAll('[data-test-kuler-palette-options]');
    const palette = await find('[data-test-kuler-palette]');
    const selected = await find('.ember-power-select-selected-item');

    assert.ok(palette);
    assert.ok(selected);
    assert.equal(selected.textContent.trim(), 'Analogous');
    assert.equal(options.length, 5);
  });

  test('selecting monochromatic gives 5 recommendations', async function(assert) {
    await selectChoose('[data-test-kuler-options]', 'Monochromatic');
    const options = await findAll('[data-test-kuler-palette-options]');
    const palette = await find('[data-test-kuler-palette]');
    const selected = await find('.ember-power-select-selected-item');

    assert.ok(palette);
    assert.ok(selected);
    assert.equal(selected.textContent.trim(), 'Monochromatic');
    assert.equal(options.length, 5);
  });

  test('selecting tetrad gives 4 recommendations', async function(assert) {
    await selectChoose('[data-test-kuler-options]', 'Tetrad');
    const options = await findAll('[data-test-kuler-palette-options]');
    const palette = await find('[data-test-kuler-palette]');
    const selected = await find('.ember-power-select-selected-item');

    assert.ok(palette);
    assert.ok(selected);
    assert.equal(selected.textContent.trim(), 'Tetrad');
    assert.equal(options.length, 4);
  });

  test('selecting triad gives 3 recommendations', async function(assert) {
    await selectChoose('[data-test-kuler-options]', 'Triad');
    const options = await findAll('[data-test-kuler-palette-options]');
    const palette = await find('[data-test-kuler-palette]');
    const selected = await find('.ember-power-select-selected-item');

    assert.ok(palette);
    assert.ok(selected);
    assert.equal(selected.textContent.trim(), 'Triad');
    assert.equal(options.length, 3);
  });
});

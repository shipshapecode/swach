import { fillIn, render, triggerKeyEvent } from '@ember/test-helpers';
import { setupRenderingTest } from 'ember-qunit';
import { module, test } from 'qunit';

import { hbs } from 'ember-cli-htmlbars';

import { waitForAll } from 'swach/tests/helpers';

module('Integration | Component | contrast-checker', function (hooks) {
  setupRenderingTest(hooks);

  test('WCAG - Score and string calculated', async function (assert) {
    await render(hbs`<ContrastChecker/>`);

    await waitForAll();

    await fillIn('[data-test-bg-input]', '#004747');
    await triggerKeyEvent('[data-test-bg-input]', 'keypress', 13);
    await fillIn('[data-test-fg-input]', '#005A2A');
    await triggerKeyEvent('[data-test-fg-input]', 'keypress', 13);

    await waitForAll();

    assert.dom('[data-test-wcag-score]').hasText('1.25');
    assert.dom('[data-test-wcag-string]').hasText('Fail');
    assert
      .dom('[data-test-contrast-preview]')
      .hasStyle({ backgroundColor: 'rgb(0, 71, 71)', color: 'rgb(0, 90, 42)' });

    await fillIn('[data-test-fg-input]', '#00A24B');
    await triggerKeyEvent('[data-test-fg-input]', 'keypress', 13);

    await waitForAll();

    assert.dom('[data-test-wcag-score]').hasText('3.15');
    assert.dom('[data-test-wcag-string]').hasText('AA Large');
    assert.dom('[data-test-contrast-preview]').hasStyle({
      backgroundColor: 'rgb(0, 71, 71)',
      color: 'rgb(0, 162, 75)'
    });

    await fillIn('[data-test-fg-input]', '#00CE60');
    await triggerKeyEvent('[data-test-fg-input]', 'keypress', 13);

    await waitForAll();

    assert.dom('[data-test-wcag-score]').hasText('5.02');
    assert.dom('[data-test-wcag-string]').hasText('AA');
    assert.dom('[data-test-contrast-preview]').hasStyle({
      backgroundColor: 'rgb(0, 71, 71)',
      color: 'rgb(0, 206, 96)'
    });

    await fillIn('[data-test-fg-input]', '#FFFFFF');
    await triggerKeyEvent('[data-test-fg-input]', 'keypress', 13);

    await waitForAll();

    assert.dom('[data-test-wcag-score]').hasText('10.54');
    assert.dom('[data-test-wcag-string]').hasText('AAA');
    assert.dom('[data-test-contrast-preview]').hasStyle({
      backgroundColor: 'rgb(0, 71, 71)',
      color: 'rgb(255, 255, 255)'
    });
  });
});

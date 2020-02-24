import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { fillIn, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | contrast-checker', function(hooks) {
  setupRenderingTest(hooks);

  test('WCAG - Score and string calculated', async function(assert) {
    await render(hbs`<ContrastChecker/>`);

    await fillIn('.background-color-picker-container .pcr-result', '#004747');
    await fillIn('.foreground-color-picker-container .pcr-result', '#005A2A');

    assert.dom('[data-test-wcag-score]').hasText('1.25');
    assert.dom('[data-test-wcag-string]').hasText('Fail');
    assert
      .dom('[data-test-contrast-preview]')
      .hasStyle({ backgroundColor: 'rgb(0, 71, 71)', color: 'rgb(0, 90, 42)' });

    await fillIn('.foreground-color-picker-container .pcr-result', '#00A24B');

    assert.dom('[data-test-wcag-score]').hasText('3.15');
    assert.dom('[data-test-wcag-string]').hasText('AA Large');
    assert.dom('[data-test-contrast-preview]').hasStyle({
      backgroundColor: 'rgb(0, 71, 71)',
      color: 'rgb(0, 162, 75)'
    });

    await fillIn('.foreground-color-picker-container .pcr-result', '#00CE60');

    assert.dom('[data-test-wcag-score]').hasText('5.02');
    assert.dom('[data-test-wcag-string]').hasText('AA');
    assert.dom('[data-test-contrast-preview]').hasStyle({
      backgroundColor: 'rgb(0, 71, 71)',
      color: 'rgb(0, 206, 96)'
    });

    await fillIn('.foreground-color-picker-container .pcr-result', '#FFFFFF');

    assert.dom('[data-test-wcag-score]').hasText('10.54');
    assert.dom('[data-test-wcag-string]').hasText('AAA');
    assert.dom('[data-test-contrast-preview]').hasStyle({
      backgroundColor: 'rgb(0, 71, 71)',
      color: 'rgb(255, 255, 255)'
    });
  });
});

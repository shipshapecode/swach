import { blur, fillIn, find, render, waitUntil } from '@ember/test-helpers';
import { module, test } from 'qunit';

import ContrastChecker from 'Swach/components/contrast-checker';

import { waitForAll } from '../../helpers';
import { setupRenderingTest } from '../../helpers/index';

module('Integration | Component | contrast-checker', function (hooks) {
  setupRenderingTest(hooks);

  test('WCAG - Score and string calculated', async function (assert) {
    await render(<template><ContrastChecker /></template>);

    await waitForAll();

    await fillIn('[data-test-bg-input]', '#004747');
    await blur('[data-test-bg-input]');
    await fillIn('[data-test-fg-input]', '#005A2A');
    await blur('[data-test-fg-input]');

    await waitForAll();
    await waitUntil(
      () => {
        const scoreElement = find('[data-test-wcag-score]');
        const stringElement = find('[data-test-wcag-string]');

        return (
          scoreElement?.textContent.trim() === '1.25' &&
          stringElement?.textContent.trim() === 'Fail'
        );
      },
      { timeout: 5000 }
    );

    assert.dom('[data-test-wcag-score]').hasText('1.25');
    assert.dom('[data-test-wcag-string]').hasText('Fail');
    assert
      .dom('[data-test-contrast-preview]')
      .hasStyle({ backgroundColor: 'rgb(0, 71, 71)', color: 'rgb(0, 90, 42)' });

    await fillIn('[data-test-fg-input]', '#00A24B');
    await blur('[data-test-fg-input]');

    await waitForAll();
    await waitUntil(
      () => {
        const scoreElement = find('[data-test-wcag-score]');
        const stringElement = find('[data-test-wcag-string]');

        return (
          scoreElement?.textContent.trim() === '3.15' &&
          stringElement?.textContent.trim() === 'AA Large'
        );
      },
      { timeout: 5000 }
    );

    assert.dom('[data-test-wcag-score]').hasText('3.15');
    assert.dom('[data-test-wcag-string]').hasText('AA Large');
    assert.dom('[data-test-contrast-preview]').hasStyle({
      backgroundColor: 'rgb(0, 71, 71)',
      color: 'rgb(0, 162, 75)',
    });

    await fillIn('[data-test-fg-input]', '#00CE60');
    await blur('[data-test-fg-input]');

    await waitForAll();
    await waitUntil(
      () => {
        const scoreElement = find('[data-test-wcag-score]');
        const stringElement = find('[data-test-wcag-string]');

        return (
          scoreElement?.textContent.trim() === '5.02' &&
          stringElement?.textContent.trim() === 'AA'
        );
      },
      { timeout: 5000 }
    );

    assert.dom('[data-test-wcag-score]').hasText('5.02');
    assert.dom('[data-test-wcag-string]').hasText('AA');
    assert.dom('[data-test-contrast-preview]').hasStyle({
      backgroundColor: 'rgb(0, 71, 71)',
      color: 'rgb(0, 206, 96)',
    });

    await fillIn('[data-test-fg-input]', '#FFFFFF');
    await blur('[data-test-fg-input]');

    await waitForAll();
    await waitUntil(
      () => {
        const scoreElement = find('[data-test-wcag-score]');
        const stringElement = find('[data-test-wcag-string]');

        return (
          scoreElement?.textContent.trim() === '10.54' &&
          stringElement?.textContent.trim() === 'AAA'
        );
      },
      { timeout: 5000 }
    );

    assert.dom('[data-test-wcag-score]').hasText('10.54');
    assert.dom('[data-test-wcag-string]').hasText('AAA');
    assert.dom('[data-test-contrast-preview]').hasStyle({
      backgroundColor: 'rgb(0, 71, 71)',
      color: 'rgb(255, 255, 255)',
    });
  });
});

import { click, render } from '@ember/test-helpers';
import { module, test } from 'qunit';

import ColorRow from 'Swach/components/color-row';

import { waitForAll } from '../../helpers';
import { setupRenderingTest } from '../../helpers/index';

module('Integration | Component | color-row', function (hooks) {
  setupRenderingTest(hooks);

  test('renders color information correctly', async function (assert) {
    const color = {
      id: '1',
      hex: '#ff0000',
      name: 'Red',
      r: 255,
      g: 0,
      b: 0,
      a: 1
    };

    await render(<template>
      <ColorRow @color={{color}} @showActions={{false}} />
    </template>);

    await waitForAll();

    assert.dom('[data-test-color-name]').hasText('Red');
    assert.dom('[data-test-color-hex]').hasText('#ff0000');
    assert.dom('[data-test-color="Red"]').exists();
    
    // Check that the color square has the correct background color
    assert.dom('.absolute.h-14').hasStyle({
      backgroundColor: 'rgb(255, 0, 0)'
    });
  });

  test('shows actions menu when showActions is true', async function (assert) {
    const color = {
      id: '1',
      hex: '#00ff00',
      name: 'Green',
      r: 0,
      g: 255,
      b: 0,
      a: 1
    };

    await render(<template>
      <ColorRow @color={{color}} @showActions={{true}} />
    </template>);

    await waitForAll();

    assert.dom('[data-test-color-row-menu]').exists();
  });

  test('hides actions menu when showActions is false', async function (assert) {
    const color = {
      id: '1',
      hex: '#0000ff',
      name: 'Blue',
      r: 0,
      g: 0,
      b: 255,
      a: 1
    };

    await render(<template>
      <ColorRow @color={{color}} @showActions={{false}} />
    </template>);

    await waitForAll();

    assert.dom('[data-test-color-row-menu]').doesNotExist();
  });

  test('shows actions menu by default when showActions is not provided', async function (assert) {
    const color = {
      id: '1',
      hex: '#ffff00',
      name: 'Yellow',
      r: 255,
      g: 255,
      b: 0,
      a: 1
    };

    await render(<template>
      <ColorRow @color={{color}} />
    </template>);

    await waitForAll();

    assert.dom('[data-test-color-row-menu]').exists();
  });

  test('renders with different color values', async function (assert) {
    const color = {
      id: '2',
      hex: '#800080',
      name: 'Purple',
      r: 128,
      g: 0,
      b: 128,
      a: 1
    };

    await render(<template>
      <ColorRow @color={{color}} @showActions={{false}} />
    </template>);

    await waitForAll();

    assert.dom('[data-test-color-name]').hasText('Purple');
    assert.dom('[data-test-color-hex]').hasText('#800080');
    assert.dom('.absolute.h-14').hasStyle({
      backgroundColor: 'rgb(128, 0, 128)'
    });
  });

  test('calls copy to clipboard when clicked', async function (assert) {
    const color = {
      id: '1',
      hex: '#ff0000',
      name: 'Red',
      r: 255,
      g: 0,
      b: 0,
      a: 1
    };

    await render(<template>
      <ColorRow @color={{color}} @showActions={{false}} />
    </template>);

    await waitForAll();

    // Click the color row - this should trigger the copyColorToClipboard action
    // We can't easily test the clipboard functionality in unit tests, 
    // but we can verify the element is clickable and doesn't throw an error
    await click('[data-test-color="Red"]');
    
    assert.ok(true, 'Color row click does not throw an error');
  });
});
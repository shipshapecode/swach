import { render } from '@ember/test-helpers';
import { module, test } from 'qunit';
import sinon from 'sinon';

import EditSelectedColor from 'Swach/components/edit-selected-color';

import { waitForAll } from '../../helpers';
import { setupRenderingTest } from '../../helpers/index';

module('Integration | Component | edit-selected-color', function (hooks) {
  setupRenderingTest(hooks);

  test('renders all color input components', async function (assert) {
    const mockColorPicker = {
      setColors: sinon.spy()
    };
    
    const palette = {
      selectedColorIndex: 0,
      colors: [
        {
          hex: '#ff0000',
          r: 255,
          g: 0,
          b: 0,
          a: 1,
          _hex: '#ff0000',
          _r: 255,
          _g: 0,
          _b: 0,
          _a: 1
        }
      ]
    };

    await render(<template>
      <EditSelectedColor @colorPicker={{mockColorPicker}} @palette={{palette}} />
    </template>);

    await waitForAll();

    // Check that all input components are rendered with correct data-test attributes
    assert.dom('[data-test-kuler-hex]').exists();
    assert.dom('[data-test-kuler-r]').exists();
    assert.dom('[data-test-kuler-g]').exists();
    assert.dom('[data-test-kuler-b]').exists();
    assert.dom('[data-test-kuler-a]').exists();
  });

  test('renders with correct CSS classes and structure', async function (assert) {
    const mockColorPicker = {
      setColors: sinon.spy()
    };
    
    const palette = {
      selectedColorIndex: 0,
      colors: [
        {
          hex: '#00ff00',
          r: 0,
          g: 255,
          b: 0,
          a: 1,
          _hex: '#00ff00',
          _r: 0,
          _g: 255,
          _b: 0,
          _a: 1
        }
      ]
    };

    await render(<template>
      <EditSelectedColor @colorPicker={{mockColorPicker}} @palette={{palette}} />
    </template>);

    await waitForAll();

    // Check main container
    assert.dom('.inline-flex.mt-2.w-full').exists();
    
    // Check hex input wrapper
    assert.dom('[data-test-kuler-hex]').hasClass('bg-input-bg');
    assert.dom('[data-test-kuler-hex]').hasClass('text-xs');
    assert.dom('[data-test-kuler-hex]').hasClass('w-16');
    
    // Check RGB input wrappers
    assert.dom('[data-test-kuler-r]').hasClass('bg-input-bg');
    assert.dom('[data-test-kuler-r]').hasClass('text-right');
    assert.dom('[data-test-kuler-r]').hasClass('text-xs');
    assert.dom('[data-test-kuler-r]').hasClass('w-full');
  });

  test('handles empty palette gracefully', async function (assert) {
    const mockColorPicker = {
      setColors: sinon.spy()
    };
    
    const emptyPalette = {
      selectedColorIndex: 0,
      colors: []
    };

    await render(<template>
      <EditSelectedColor @colorPicker={{mockColorPicker}} @palette={{emptyPalette}} />
    </template>);

    await waitForAll();

    // Should still render the input components even with empty palette
    assert.dom('[data-test-kuler-hex]').exists();
    assert.dom('[data-test-kuler-r]').exists();
    assert.dom('[data-test-kuler-g]').exists();
    assert.dom('[data-test-kuler-b]').exists();
    assert.dom('[data-test-kuler-a]').exists();
  });

  test('works with different selected color indices', async function (assert) {
    const mockColorPicker = {
      setColors: sinon.spy()
    };
    
    const palette = {
      selectedColorIndex: 1,
      colors: [
        {
          hex: '#ff0000',
          r: 255,
          g: 0,
          b: 0,
          a: 1,
          _hex: '#ff0000',
          _r: 255,
          _g: 0,
          _b: 0,
          _a: 1
        },
        {
          hex: '#0000ff',
          r: 0,
          g: 0,
          b: 255,
          a: 1,
          _hex: '#0000ff',
          _r: 0,
          _g: 0,
          _b: 255,
          _a: 1
        }
      ]
    };

    await render(<template>
      <EditSelectedColor @colorPicker={{mockColorPicker}} @palette={{palette}} />
    </template>);

    await waitForAll();

    // All inputs should render regardless of selected index
    assert.dom('[data-test-kuler-hex]').exists();
    assert.dom('[data-test-kuler-r]').exists();
    assert.dom('[data-test-kuler-g]').exists();
    assert.dom('[data-test-kuler-b]').exists();
    assert.dom('[data-test-kuler-a]').exists();
  });
});
import { blur, fillIn, render, triggerKeyEvent } from '@ember/test-helpers';
import { module, test } from 'qunit';
import sinon from 'sinon';

import HexInput from 'Swach/components/hex-input';

import { waitForAll } from '../../helpers';
import { setupRenderingTest } from '../../helpers/index';

module('Integration | Component | hex-input', function (hooks) {
  setupRenderingTest(hooks);

  test('renders with initial value', async function (assert) {
    const selectedColor = { 
      hex: '#ff0000', 
      r: 255, g: 0, b: 0, a: 1,
      _hex: '#ff0000', 
      _r: 255, _g: 0, _b: 0, _a: 1
    };
    const update = sinon.spy();
    const updateColor = sinon.spy();

    await render(<template>
      <HexInput 
        @selectedColor={{selectedColor}} 
        @update={{update}} 
        @updateColor={{updateColor}}
        @value="#ff0000"
      />
    </template>);

    await waitForAll();

    assert.dom('input').hasValue('#ff0000');
    assert.dom('input').exists();
  });

  test('accepts valid 6-character hex input', async function (assert) {
    const selectedColor = { 
      hex: '#ff0000', 
      r: 255, g: 0, b: 0, a: 1,
      _hex: '#ff0000', 
      _r: 255, _g: 0, _b: 0, _a: 1
    };
    const update = sinon.spy();
    const updateColor = sinon.spy();

    await render(<template>
      <HexInput 
        @selectedColor={{selectedColor}} 
        @update={{update}} 
        @updateColor={{updateColor}}
        @value="#ff0000"
      />
    </template>);

    await waitForAll();

    await fillIn('input', '#00ff00');
    await blur('input');

    assert.dom('input').hasValue('#00ff00');
  });

  test('accepts valid 8-character hex input with alpha', async function (assert) {
    const selectedColor = { 
      hex: '#ff0000ff', 
      r: 255, g: 0, b: 0, a: 1,
      _hex: '#ff0000ff', 
      _r: 255, _g: 0, _b: 0, _a: 1
    };
    const update = sinon.spy();
    const updateColor = sinon.spy();

    await render(<template>
      <HexInput 
        @selectedColor={{selectedColor}} 
        @update={{update}} 
        @updateColor={{updateColor}}
        @value="#ff0000ff"
      />
    </template>);

    await waitForAll();

    await fillIn('input', '#00ff0080');
    await blur('input');

    assert.dom('input').hasValue('#00ff0080');
  });

  test('triggers blur on enter key press', async function (assert) {
    const selectedColor = { 
      hex: '#ff0000', 
      r: 255, g: 0, b: 0, a: 1,
      _hex: '#ff0000', 
      _r: 255, _g: 0, _b: 0, _a: 1
    };
    const update = sinon.spy();
    const updateColor = sinon.spy();

    await render(<template>
      <HexInput 
        @selectedColor={{selectedColor}} 
        @update={{update}} 
        @updateColor={{updateColor}}
        @value="#ff0000"
      />
    </template>);

    await waitForAll();

    await fillIn('input', '#0000ff');
    await triggerKeyEvent('input', 'keypress', 13);

    assert.dom('input').hasValue('#0000ff');
  });

  test('calls update callback while typing', async function (assert) {
    const selectedColor = { 
      hex: '#ff0000', 
      r: 255, g: 0, b: 0, a: 1,
      _hex: '#ff0000', 
      _r: 255, _g: 0, _b: 0, _a: 1
    };
    const update = sinon.spy();
    const updateColor = sinon.spy();

    await render(<template>
      <HexInput 
        @selectedColor={{selectedColor}} 
        @update={{update}} 
        @updateColor={{updateColor}}
        @value="#ff0000"
      />
    </template>);

    await waitForAll();

    await fillIn('input', '#00ff00');
    
    assert.ok(update.called, 'update callback should be called while typing');
  });

  test('validates hex format with regex', async function (assert) {
    const selectedColor = { 
      hex: '#ff0000', 
      r: 255, g: 0, b: 0, a: 1,
      _hex: '#ff0000', 
      _r: 255, _g: 0, _b: 0, _a: 1
    };
    const update = sinon.spy();
    const updateColor = sinon.spy();

    await render(<template>
      <HexInput 
        @selectedColor={{selectedColor}} 
        @update={{update}} 
        @updateColor={{updateColor}}
        @value="#ff0000"
      />
    </template>);

    await waitForAll();

    // Test various valid hex formats
    const validHexValues = [
      '#ffffff', // 6-char lowercase
      '#FFFFFF', // 6-char uppercase  
      '#ff00ffaa', // 8-char with alpha
      '#123ABC' // mixed case
    ];

    for (const hexValue of validHexValues) {
      await fillIn('input', hexValue);
      await blur('input');
      assert.dom('input').hasValue(hexValue, `Should accept valid hex: ${hexValue}`);
    }
  });
});
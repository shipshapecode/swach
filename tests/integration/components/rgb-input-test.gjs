import { blur, fillIn, render, triggerKeyEvent } from '@ember/test-helpers';
import { module, test } from 'qunit';
import sinon from 'sinon';

import RgbInput from 'Swach/components/rgb-input';

import { waitForAll } from '../../helpers';
import { setupRenderingTest } from '../../helpers/index';

module('Integration | Component | rgb-input', function (hooks) {
  setupRenderingTest(hooks);

  test('renders red channel correctly', async function (assert) {
    const selectedColor = { 
      r: 255, g: 0, b: 0, a: 1,
      _r: 255, _g: 0, _b: 0, _a: 1
    };
    const update = sinon.spy();
    const updateColor = sinon.spy();

    await render(<template>
      <RgbInput 
        @selectedColor={{selectedColor}} 
        @type="r"
        @update={{update}} 
        @updateColor={{updateColor}}
        @value={{255}}
      />
    </template>);

    await waitForAll();

    assert.dom('.input-prefix').hasText('R:');
    assert.dom('input').hasValue('255');
    assert.dom('input').hasAttribute('maxlength', '3');
  });

  test('renders green channel correctly', async function (assert) {
    const selectedColor = { 
      r: 0, g: 255, b: 0, a: 1,
      _r: 0, _g: 255, _b: 0, _a: 1
    };
    const update = sinon.spy();
    const updateColor = sinon.spy();

    await render(<template>
      <RgbInput 
        @selectedColor={{selectedColor}} 
        @type="g"
        @update={{update}} 
        @updateColor={{updateColor}}
        @value={{255}}
      />
    </template>);

    await waitForAll();

    assert.dom('.input-prefix').hasText('G:');
    assert.dom('input').hasValue('255');
  });

  test('renders blue channel correctly', async function (assert) {
    const selectedColor = { 
      r: 0, g: 0, b: 255, a: 1,
      _r: 0, _g: 0, _b: 255, _a: 1
    };
    const update = sinon.spy();
    const updateColor = sinon.spy();

    await render(<template>
      <RgbInput 
        @selectedColor={{selectedColor}} 
        @type="b"
        @update={{update}} 
        @updateColor={{updateColor}}
        @value={{255}}
      />
    </template>);

    await waitForAll();

    assert.dom('.input-prefix').hasText('B:');
    assert.dom('input').hasValue('255');
  });

  test('accepts valid RGB values', async function (assert) {
    const selectedColor = { 
      r: 128, g: 128, b: 128, a: 1,
      _r: 128, _g: 128, _b: 128, _a: 1
    };
    const update = sinon.spy();
    const updateColor = sinon.spy();

    await render(<template>
      <RgbInput 
        @selectedColor={{selectedColor}} 
        @type="r"
        @update={{update}} 
        @updateColor={{updateColor}}
        @value={{128}}
      />
    </template>);

    await waitForAll();

    await fillIn('input', '200');
    await blur('input');

    assert.dom('input').hasValue('200');
  });

  test('handles enter key press', async function (assert) {
    const selectedColor = { 
      r: 100, g: 100, b: 100, a: 1,
      _r: 100, _g: 100, _b: 100, _a: 1
    };
    const update = sinon.spy();
    const updateColor = sinon.spy();

    await render(<template>
      <RgbInput 
        @selectedColor={{selectedColor}} 
        @type="g"
        @update={{update}} 
        @updateColor={{updateColor}}
        @value={{100}}
      />
    </template>);

    await waitForAll();

    await fillIn('input', '150');
    await triggerKeyEvent('input', 'keypress', 13);

    assert.dom('input').hasValue('150');
  });

  test('validates RGB value range', async function (assert) {
    const selectedColor = { 
      r: 0, g: 0, b: 0, a: 1,
      _r: 0, _g: 0, _b: 0, _a: 1
    };
    const update = sinon.spy();
    const updateColor = sinon.spy();

    await render(<template>
      <RgbInput 
        @selectedColor={{selectedColor}} 
        @type="r"
        @update={{update}} 
        @updateColor={{updateColor}}
        @value={{0}}
      />
    </template>);

    await waitForAll();

    // Test boundary values
    await fillIn('input', '0');
    await blur('input');
    assert.dom('input').hasValue('0');

    await fillIn('input', '255');
    await blur('input');
    assert.dom('input').hasValue('255');

    await fillIn('input', '128');
    await blur('input');
    assert.dom('input').hasValue('128');
  });

  test('calls update callback while typing', async function (assert) {
    const selectedColor = { 
      r: 100, g: 100, b: 100, a: 1,
      _r: 100, _g: 100, _b: 100, _a: 1
    };
    const update = sinon.spy();
    const updateColor = sinon.spy();

    await render(<template>
      <RgbInput 
        @selectedColor={{selectedColor}} 
        @type="r"
        @update={{update}} 
        @updateColor={{updateColor}}
        @value={{100}}
      />
    </template>);

    await waitForAll();

    await fillIn('input', '150');
    
    assert.ok(update.called, 'update callback should be called while typing');
  });
});
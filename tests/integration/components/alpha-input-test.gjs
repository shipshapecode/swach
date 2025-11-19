import { blur, fillIn, render, triggerKeyEvent } from '@ember/test-helpers';
import { module, test } from 'qunit';
import sinon from 'sinon';

import AlphaInput from 'Swach/components/alpha-input';

import { waitForAll } from '../../helpers';
import { setupRenderingTest } from '../../helpers/index';

module('Integration | Component | alpha-input', function (hooks) {
  setupRenderingTest(hooks);

  test('renders with correct structure', async function (assert) {
    const selectedColor = { a: 1, r: 255, g: 0, b: 0 };
    const update = sinon.spy();
    const updateColor = sinon.spy();

    await render(<template>
      <AlphaInput 
        @selectedColor={{selectedColor}} 
        @update={{update}} 
        @updateColor={{updateColor}}
        @value={{1}}
      />
    </template>);

    await waitForAll();

    assert.dom('.input-prefix').hasText('A:');
    assert.dom('input').exists();
    assert.dom('input').hasAttribute('maxlength', '4');
  });

  test('accepts valid alpha values', async function (assert) {
    const selectedColor = { a: 1, r: 255, g: 0, b: 0 };
    const update = sinon.spy();
    const updateColor = sinon.spy();

    await render(<template>
      <AlphaInput 
        @selectedColor={{selectedColor}} 
        @update={{update}} 
        @updateColor={{updateColor}}
        @value={{1}}
      />
    </template>);

    await waitForAll();

    await fillIn('input', '0.5');
    await blur('input');

    // Verify the input accepts the value
    assert.dom('input').hasValue('0.5');
  });

  test('handles enter key press to blur input', async function (assert) {
    const selectedColor = { a: 1, r: 255, g: 0, b: 0 };
    const update = sinon.spy();
    const updateColor = sinon.spy();

    await render(<template>
      <AlphaInput 
        @selectedColor={{selectedColor}} 
        @update={{update}} 
        @updateColor={{updateColor}}
        @value={{1}}
      />
    </template>);

    await waitForAll();

    await fillIn('input', '0.8');
    await triggerKeyEvent('input', 'keypress', 13); // Enter key

    // The input should still contain the value after enter press
    assert.dom('input').hasValue('0.8');
  });

  test('validates alpha regex pattern', async function (assert) {
    const selectedColor = { a: 1, r: 255, g: 0, b: 0 };
    const update = sinon.spy();
    const updateColor = sinon.spy();

    await render(<template>
      <AlphaInput 
        @selectedColor={{selectedColor}} 
        @update={{update}} 
        @updateColor={{updateColor}}
        @value={{0}}
      />
    </template>);

    await waitForAll();

    // Test valid values
    await fillIn('input', '0');
    await blur('input');
    assert.dom('input').hasValue('0');

    await fillIn('input', '1');
    await blur('input');
    assert.dom('input').hasValue('1');

    await fillIn('input', '0.5');
    await blur('input');
    assert.dom('input').hasValue('0.5');

    await fillIn('input', '0.99');
    await blur('input');
    assert.dom('input').hasValue('0.99');
  });
});
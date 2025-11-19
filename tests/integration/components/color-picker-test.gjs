import { click, render } from '@ember/test-helpers';
import { module, test } from 'qunit';
import sinon from 'sinon';

import ColorPicker from 'Swach/components/color-picker';

import { waitForAll } from '../../helpers';
import { setupRenderingTest } from '../../helpers/index';

module('Integration | Component | color-picker', function (hooks) {
  setupRenderingTest(hooks);

  test('renders when isShown is true', async function (assert) {
    const saveColor = sinon.spy();
    const toggleIsShown = sinon.spy();

    await render(<template>
      <ColorPicker 
        @isShown={{true}} 
        @saveColor={{saveColor}} 
        @toggleIsShown={{toggleIsShown}} 
      />
    </template>);

    await waitForAll();

    assert.dom('[data-test-color-picker]').exists();
    assert.dom('.color-picker-popover').exists();
  });

  test('does not render when isShown is false', async function (assert) {
    const saveColor = sinon.spy();
    const toggleIsShown = sinon.spy();

    await render(<template>
      <ColorPicker 
        @isShown={{false}} 
        @saveColor={{saveColor}} 
        @toggleIsShown={{toggleIsShown}} 
      />
    </template>);

    await waitForAll();

    assert.dom('[data-test-color-picker]').doesNotExist();
    assert.dom('.color-picker-popover').doesNotExist();
  });

  test('renders all input components when shown', async function (assert) {
    const saveColor = sinon.spy();
    const toggleIsShown = sinon.spy();

    await render(<template>
      <ColorPicker 
        @isShown={{true}} 
        @saveColor={{saveColor}} 
        @toggleIsShown={{toggleIsShown}} 
      />
    </template>);

    await waitForAll();

    // Check for color input components
    assert.dom('[data-test-color-picker-hex]').exists();
    assert.dom('[data-test-color-picker-r]').exists();
    assert.dom('[data-test-color-picker-g]').exists();
    assert.dom('[data-test-color-picker-b]').exists();
    assert.dom('[data-test-color-picker-a]').exists();
  });

  test('renders action buttons', async function (assert) {
    const saveColor = sinon.spy();
    const toggleIsShown = sinon.spy();

    await render(<template>
      <ColorPicker 
        @isShown={{true}} 
        @saveColor={{saveColor}} 
        @toggleIsShown={{toggleIsShown}} 
      />
    </template>);

    await waitForAll();

    assert.dom('[data-test-color-picker-cancel]').exists();
    assert.dom('[data-test-color-picker-cancel]').hasText('Cancel');
    
    assert.dom('[data-test-color-picker-save]').exists();
    assert.dom('[data-test-color-picker-save]').hasText('🎉 Save color');
  });

  test('renders color format displays', async function (assert) {
    const saveColor = sinon.spy();
    const toggleIsShown = sinon.spy();

    await render(<template>
      <ColorPicker 
        @isShown={{true}} 
        @saveColor={{saveColor}} 
        @toggleIsShown={{toggleIsShown}} 
      />
    </template>);

    await waitForAll();

    // Check for color format labels
    assert.dom('span').containsText('HEX');
    assert.dom('span').containsText('RGB');
    assert.dom('span').containsText('HSL');
    assert.dom('span').containsText('HSV');
  });

  test('cancel button calls toggleIsShown', async function (assert) {
    const saveColor = sinon.spy();
    const toggleIsShown = sinon.spy();

    await render(<template>
      <ColorPicker 
        @isShown={{true}} 
        @saveColor={{saveColor}} 
        @toggleIsShown={{toggleIsShown}} 
      />
    </template>);

    await waitForAll();

    await click('[data-test-color-picker-cancel]');
    
    assert.ok(toggleIsShown.calledOnce, 'toggleIsShown should be called when cancel is clicked');
  });

  test('has correct CSS classes and structure', async function (assert) {
    const saveColor = sinon.spy();
    const toggleIsShown = sinon.spy();

    await render(<template>
      <ColorPicker 
        @isShown={{true}} 
        @saveColor={{saveColor}} 
        @toggleIsShown={{toggleIsShown}} 
      />
    </template>);

    await waitForAll();

    // Check main popover structure
    assert.dom('.color-picker-popover').hasClass('bg-main');
    assert.dom('.color-picker-popover').hasClass('border-menu');
    assert.dom('.color-picker-popover').hasClass('fixed');
    assert.dom('.color-picker-popover').hasClass('left-0');
    
    // Check color picker container
    assert.dom('#color-picker-container').exists();
    assert.dom('#color-picker-container').hasClass('flex-1');
    assert.dom('#color-picker-container').hasClass('w-auto');
  });

  test('renders with selected color when provided', async function (assert) {
    const saveColor = sinon.spy();
    const toggleIsShown = sinon.spy();
    const selectedColor = {
      hex: '#ff0000',
      r: 255,
      g: 0,
      b: 0,
      a: 1,
      _hex: '#ff0000',
      _r: 255,
      _g: 0,
      _b: 0,
      _a: 1,
      name: 'Red'
    };

    await render(<template>
      <ColorPicker 
        @isShown={{true}} 
        @saveColor={{saveColor}} 
        @toggleIsShown={{toggleIsShown}}
        @selectedColor={{selectedColor}}
      />
    </template>);

    await waitForAll();

    assert.dom('[data-test-color-picker]').exists();
    // The component should render without errors when a selectedColor is provided
    assert.ok(true, 'Component renders successfully with selectedColor');
  });
});
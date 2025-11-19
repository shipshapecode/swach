import { render, click } from '@ember/test-helpers';
import { module, test } from 'qunit';
import sinon from 'sinon';

import ToggleSwitch from 'Swach/components/toggle-switch';

import { setupRenderingTest } from '../../helpers/index';

module('Integration | Component | toggle-switch', function (hooks) {
  setupRenderingTest(hooks);

  test('renders unchecked state correctly', async function (assert) {
    const onClick = sinon.spy();

    await render(<template><ToggleSwitch @checked={{false}} @onClick={{onClick}} /></template>);

    assert.dom('button').hasAttribute('aria-pressed', 'false');
    assert.dom('button').hasClass('bg-gray-200');
    assert.dom('button').doesNotHaveClass('bg-green-400');
    assert.dom('button span').hasClass('translate-x-0');
    assert.dom('button span').doesNotHaveClass('translate-x-8');
  });

  test('renders checked state correctly', async function (assert) {
    const onClick = sinon.spy();

    await render(<template><ToggleSwitch @checked={{true}} @onClick={{onClick}} /></template>);

    assert.dom('button').hasAttribute('aria-pressed', 'true');
    assert.dom('button').hasClass('bg-green-400');
    assert.dom('button').doesNotHaveClass('bg-gray-200');
    assert.dom('button span').hasClass('translate-x-8');
    assert.dom('button span').doesNotHaveClass('translate-x-0');
  });

  test('shows correct icons for checked/unchecked states', async function (assert) {
    const onClick = sinon.spy();

    await render(<template><ToggleSwitch @checked={{false}} @onClick={{onClick}} /></template>);

    // When unchecked, should show X icon (first span visible)
    assert.dom('button span span:first-child').hasClass('opacity-100');
    assert.dom('button span span:last-child').hasClass('opacity-0');
  });

  test('shows checkmark icon when checked', async function (assert) {
    const onClick = sinon.spy();

    await render(<template><ToggleSwitch @checked={{true}} @onClick={{onClick}} /></template>);

    // When checked, should show checkmark icon (second span visible)
    assert.dom('button span span:first-child').hasClass('opacity-0');
    assert.dom('button span span:last-child').hasClass('opacity-100');
  });

  test('maintains proper accessibility attributes', async function (assert) {
    const onClick = sinon.spy();

    await render(<template><ToggleSwitch @checked={{false}} @onClick={{onClick}} /></template>);

    assert.dom('button').hasAttribute('type', 'button');
    assert.dom('button').hasAttribute('aria-pressed', 'false');
  });

  test('calls onClick callback when clicked', async function (assert) {
    const onClick = sinon.spy();

    await render(<template><ToggleSwitch @checked={{false}} @onClick={{onClick}} /></template>);

    assert.ok(onClick.notCalled, 'onClick should not be called initially');

    await click('button');
    assert.ok(onClick.calledOnce, 'onClick should be called once after first click');

    await click('button');
    assert.ok(onClick.calledTwice, 'onClick should be called twice after second click');

    await click('button');
    assert.ok(onClick.calledThrice, 'onClick should be called thrice after third click');
  });

  test('renders with Off and On labels', async function (assert) {
    const onClick = sinon.spy();

    await render(<template><ToggleSwitch @checked={{false}} @onClick={{onClick}} /></template>);

    assert.dom().containsText('Off');
    assert.dom().containsText('On');
  });
});
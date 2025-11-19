import { click, render } from '@ember/test-helpers';
import { module, test } from 'qunit';
import sinon from 'sinon';

import LoadingButton from 'Swach/components/loading-button';

import { waitForAll } from '../../helpers';
import { setupRenderingTest } from '../../helpers/index';

module('Integration | Component | loading-button', function (hooks) {
  setupRenderingTest(hooks);

  test('renders button with content when not loading', async function (assert) {
    const onClick = sinon.spy();

    await render(<template>
      <LoadingButton @loading={{false}} @onClick={{onClick}}>
        Save Changes
      </LoadingButton>
    </template>);

    await waitForAll();

    assert.dom('button').hasText('Save Changes');
    assert.dom('button').isNotDisabled();
    assert.dom('.dot-typing').doesNotExist();
    assert.dom('button').hasAttribute('type', 'button');
  });

  test('renders loading state correctly', async function (assert) {
    const onClick = sinon.spy();

    await render(<template>
      <LoadingButton @loading={{true}} @onClick={{onClick}}>
        Save Changes
      </LoadingButton>
    </template>);

    await waitForAll();

    assert.dom('button').isDisabled();
    assert.dom('button').hasClass('disabled:opacity-50');
    assert.dom('.dot-typing').exists();
    assert.dom('button').doesNotContainText('Save Changes');
  });

  test('calls onClick when clicked and not loading', async function (assert) {
    const onClick = sinon.spy();

    await render(<template>
      <LoadingButton @loading={{false}} @onClick={{onClick}}>
        Click Me
      </LoadingButton>
    </template>);

    await waitForAll();

    await click('button');
    
    assert.ok(onClick.calledOnce, 'onClick should be called once');
  });

  test('does not call onClick when disabled/loading', async function (assert) {
    const onClick = sinon.spy();

    await render(<template>
      <LoadingButton @loading={{true}} @onClick={{onClick}}>
        Click Me
      </LoadingButton>
    </template>);

    await waitForAll();

    await click('button');
    
    assert.ok(onClick.notCalled, 'onClick should not be called when button is disabled');
  });

  test('shows custom content when provided', async function (assert) {
    const onClick = sinon.spy();

    await render(<template>
      <LoadingButton @loading={{false}} @onClick={{onClick}}>
        <span class="custom-content">💾 Save Document</span>
      </LoadingButton>
    </template>);

    await waitForAll();

    assert.dom('.custom-content').exists();
    assert.dom('.custom-content').hasText('💾 Save Document');
    assert.dom('.dot-typing').doesNotExist();
  });

  test('hides custom content when loading', async function (assert) {
    const onClick = sinon.spy();

    await render(<template>
      <LoadingButton @loading={{true}} @onClick={{onClick}}>
        <span class="custom-content">💾 Save Document</span>
      </LoadingButton>
    </template>);

    await waitForAll();

    assert.dom('.custom-content').doesNotExist();
    assert.dom('.dot-typing').exists();
  });

  test('has correct CSS classes', async function (assert) {
    const onClick = sinon.spy();

    await render(<template>
      <LoadingButton @loading={{false}} @onClick={{onClick}}>
        Test Button
      </LoadingButton>
    </template>);

    await waitForAll();

    assert.dom('button').hasClass('btn');
    assert.dom('button').hasClass('btn-primary');
    assert.dom('button').hasClass('h-10');
    assert.dom('button').hasClass('w-full');
    assert.dom('button').hasClass('disabled:opacity-50');
  });

  test('maintains accessibility attributes', async function (assert) {
    const onClick = sinon.spy();

    await render(<template>
      <LoadingButton @loading={{false}} @onClick={{onClick}}>
        Process Data
      </LoadingButton>
    </template>);

    await waitForAll();

    assert.dom('button').hasAttribute('type', 'button');
    assert.dom('button').doesNotHaveAttribute('disabled');
  });

  test('maintains accessibility when loading', async function (assert) {
    const onClick = sinon.spy();

    await render(<template>
      <LoadingButton @loading={{true}} @onClick={{onClick}}>
        Process Data
      </LoadingButton>
    </template>);

    await waitForAll();

    assert.dom('button').hasAttribute('disabled');
    assert.dom('button').hasAttribute('type', 'button');
  });
});
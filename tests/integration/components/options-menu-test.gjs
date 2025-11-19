import { click, render, triggerEvent } from '@ember/test-helpers';
import { module, test } from 'qunit';

import { on } from '@ember/modifier';

import OptionsMenu from 'Swach/components/options-menu';

import { waitForAll } from '../../helpers';
import { setupRenderingTest } from '../../helpers/index';

module('Integration | Component | options-menu', function (hooks) {
  setupRenderingTest(hooks);

  test('toggles menu visibility when trigger is clicked', async function (assert) {
    await render(
      <template>
        <OptionsMenu>
          <:trigger>Menu Button</:trigger>
          <:content>Menu Content</:content>
        </OptionsMenu>
      </template>
    );

    await waitForAll();

    // Initially closed
    assert.dom('[data-test-options-trigger]').hasText('Menu Button');
    assert.dom('[data-test-options-content]').doesNotExist();

    // Click to open
    await click('[data-test-options-trigger]');
    assert.dom('[data-test-options-content]').exists();
    assert.dom('[data-test-options-content]').hasText('Menu Content');

    // Click to close
    await click('[data-test-options-trigger]');
    assert.dom('[data-test-options-content]').doesNotExist();
  });

  test('closes menu when clicking inside content area', async function (assert) {
    await render(
      <template>
        <OptionsMenu>
          <:trigger>Menu</:trigger>
          <:content><button data-test-menu-item>Menu Item</button></:content>
        </OptionsMenu>
      </template>
    );

    await waitForAll();

    // Open menu
    await click('[data-test-options-trigger]');
    assert.dom('[data-test-options-content]').exists();

    // Click inside content area
    await click('[data-test-menu-item]');
    assert.dom('[data-test-options-content]').doesNotExist();
  });

  test('closes menu when clicking outside', async function (assert) {
    await render(
      <template>
        <div>
          <div data-test-outside-element>Outside Element</div>
          <OptionsMenu>
            <:trigger>Menu</:trigger>
            <:content>Menu Content</:content>
          </OptionsMenu>
        </div>
      </template>
    );

    await waitForAll();

    // Open menu
    await click('[data-test-options-trigger]');
    assert.dom('[data-test-options-content]').exists();

    // Click outside - trigger mousedown event as the component listens for that
    await triggerEvent('[data-test-outside-element]', 'mousedown');
    assert.dom('[data-test-options-content]').doesNotExist();
  });

  test('shows CSS transitions when opening and closing', async function (assert) {
    await render(
      <template>
        <OptionsMenu>
          <:trigger>Animated Menu</:trigger>
          <:content>Animated Content</:content>
        </OptionsMenu>
      </template>
    );

    await waitForAll();

    await click('[data-test-options-trigger]');

    // Check that CSS transition classes are applied
    assert.dom('[data-test-options-content]').exists();
    assert.dom('[data-test-options-content]').hasClass('transition');
    assert.dom('[data-test-options-content]').hasClass('ease-out');
    assert.dom('[data-test-options-content]').hasClass('duration-100');
  });

  test('applies correct positioning classes', async function (assert) {
    await render(
      <template>
        <div>
          <OptionsMenu @position="left">
            <:trigger>Left Menu</:trigger>
            <:content>Left Content</:content>
          </OptionsMenu>
          <OptionsMenu @position="right">
            <:trigger>Right Menu</:trigger>
            <:content>Right Content</:content>
          </OptionsMenu>
          <OptionsMenu>
            <:trigger>Default Menu</:trigger>
            <:content>Default Content</:content>
          </OptionsMenu>
        </div>
      </template>
    );

    await waitForAll();

    // Open all menus
    await click('[data-test-options-trigger]:nth-of-type(1)');
    await click('[data-test-options-trigger]:nth-of-type(2)');
    await click('[data-test-options-trigger]:nth-of-type(3)');

    const leftMenu = '[data-test-options-content]:nth-of-type(1)';
    const rightMenu = '[data-test-options-content]:nth-of-type(2)';
    const defaultMenu = '[data-test-options-content]:nth-of-type(3)';

    // Left positioning
    assert.dom(leftMenu).hasClass('left-0');
    assert.dom(leftMenu).hasClass('origin-top-left');

    // Right positioning
    assert.dom(rightMenu).hasClass('right-0');
    assert.dom(rightMenu).hasClass('origin-top-right');

    // Default positioning (should be right)
    assert.dom(defaultMenu).hasClass('right-0');
    assert.dom(defaultMenu).hasClass('origin-top-right');
  });

  test('toggles background highlighting when showBackground is true', async function (assert) {
    await render(
      <template>
        <div>
          <OptionsMenu @showBackground={{true}}>
            <:trigger>Background Menu</:trigger>
            <:content>Background Content</:content>
          </OptionsMenu>
          <OptionsMenu @showBackground={{false}}>
            <:trigger>No Background Menu</:trigger>
            <:content>No Background Content</:content>
          </OptionsMenu>
        </div>
      </template>
    );

    await waitForAll();

    const backgroundTrigger = '[data-test-options-trigger]:nth-of-type(1)';
    const noBackgroundTrigger = '[data-test-options-trigger]:nth-of-type(2)';

    // Initially no background
    assert.dom(backgroundTrigger).doesNotHaveClass('bg-main');
    assert.dom(noBackgroundTrigger).doesNotHaveClass('bg-main');

    // Open menu with background
    await click(backgroundTrigger);
    assert.dom(backgroundTrigger).hasClass('bg-main');

    // Open menu without background
    await click(noBackgroundTrigger);
    assert.dom(noBackgroundTrigger).doesNotHaveClass('bg-main');

    // Close first menu
    await click(backgroundTrigger);
    assert.dom(backgroundTrigger).doesNotHaveClass('bg-main');
  });

  test('applies custom CSS classes', async function (assert) {
    await render(
      <template>
        <OptionsMenu
          @triggerClasses="custom-trigger-class another-class"
          @optionsClasses="custom-options-class menu-class"
        >
          <:trigger>Custom Menu</:trigger>
          <:content>Custom Content</:content>
        </OptionsMenu>
      </template>
    );

    await waitForAll();

    // Check trigger classes
    assert.dom('[data-test-options-trigger]').hasClass('custom-trigger-class');
    assert.dom('[data-test-options-trigger]').hasClass('another-class');

    // Open menu to check options classes
    await click('[data-test-options-trigger]');
    assert.dom('[data-test-options-content]').hasClass('custom-options-class');
    assert.dom('[data-test-options-content]').hasClass('menu-class');
  });

  test('handles complex menu content with interactions', async function (assert) {
    let actionCalled = false;
    const menuAction = () => {
      actionCalled = true;
    };

    this.menuAction = menuAction;

    await render(
      <template>
        <OptionsMenu>
          <:trigger>Complex Menu</:trigger>
          <:content>
            <button data-test-action-button {{on "click" this.menuAction}}>
              Action Button
            </button>
            <div data-test-menu-info>Info Section</div>
          </:content>
        </OptionsMenu>
      </template>
    );

    await waitForAll();

    // Open menu
    await click('[data-test-options-trigger]');
    assert.dom('[data-test-action-button]').exists();
    assert.dom('[data-test-menu-info]').hasText('Info Section');

    // Interact with menu content
    await click('[data-test-action-button]');

    // Action should have been called and menu should close
    assert.ok(actionCalled, 'Menu action should be called');
    assert
      .dom('[data-test-options-content]')
      .doesNotExist('Menu should close after action');
  });

  test('maintains state correctly through multiple interactions', async function (assert) {
    await render(
      <template>
        <OptionsMenu @showBackground={{true}}>
          <:trigger>State Menu</:trigger>
          <:content>State Content</:content>
        </OptionsMenu>
      </template>
    );

    await waitForAll();

    // Multiple open/close cycles
    for (let i = 0; i < 3; i++) {
      // Open
      await click('[data-test-options-trigger]');
      assert
        .dom('[data-test-options-content]')
        .exists(`Menu should open on cycle ${i + 1}`);
      assert
        .dom('[data-test-options-trigger]')
        .hasClass('bg-main', `Background should show on cycle ${i + 1}`);

      // Close
      await click('[data-test-options-trigger]');
      assert
        .dom('[data-test-options-content]')
        .doesNotExist(`Menu should close on cycle ${i + 1}`);
      assert
        .dom('[data-test-options-trigger]')
        .doesNotHaveClass(
          'bg-main',
          `Background should hide on cycle ${i + 1}`
        );
    }
  });
});

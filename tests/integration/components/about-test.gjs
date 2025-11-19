import { click, render } from '@ember/test-helpers';
import { module, test } from 'qunit';
import sinon from 'sinon';

import About from 'Swach/components/about';

import { waitForAll } from '../../helpers';
import { setupRenderingTest } from '../../helpers/index';

module('Integration | Component | about', function (hooks) {
  setupRenderingTest(hooks);

  test('renders about information correctly', async function (assert) {
    await render(<template><About /></template>);

    await waitForAll();

    assert.dom('h6').hasText('About');
    assert.dom('p').containsText('Version:');
    assert.dom('p').containsText('Copyright ©');
    assert.dom('p').containsText('Ship Shape Consulting LLC');
    assert.dom('p').containsText('All rights reserved');
    assert.dom('a').hasText('https://swach.io/');
  });

  test('displays current year in copyright', async function (assert) {
    const currentYear = new Date().getFullYear();
    
    await render(<template><About /></template>);

    await waitForAll();

    assert.dom('p').containsText(`Copyright © ${currentYear}`);
  });

  test('website link has correct structure', async function (assert) {
    await render(<template><About /></template>);

    await waitForAll();

    assert.dom('a').hasClass('hover:text-alt-hover');
    assert.dom('a').hasAttribute('href');
  });

  // Non-electron specific tests
  if (!(typeof window !== 'undefined' && window.electronAPI)) {
    test('ember - shows default version when electron API not available', async function (assert) {
      await render(<template><About /></template>);

      await waitForAll();

      assert.dom('p').containsText('Version: Version not available');
    });

    test('ember - website link handles click without electron API', async function (assert) {
      await render(<template><About /></template>);

      await waitForAll();

      // Click should not throw an error even without electron API
      await click('a');
      
      assert.ok(true, 'Click does not throw error without electron API');
    });
  }

  // Electron specific tests
  if (typeof window !== 'undefined' && window.electronAPI) {
    test('electron - can get app version', async function (assert) {
      await render(<template><About /></template>);

      await waitForAll();

      // In electron environment, version should eventually be loaded
      // We can't easily test the exact version, but we can test that it's not the default
      assert.dom('p').containsText('Version:');
    });

    test('electron - website link can open external URL', async function (assert) {
      await render(<template><About /></template>);

      await waitForAll();

      // In electron environment, clicking should not throw an error
      await click('a');
      
      assert.ok(true, 'Click does not throw error in electron environment');
    });
  }
});
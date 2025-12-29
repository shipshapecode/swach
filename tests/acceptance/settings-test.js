import { click, currentURL, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';

import { resetStorage } from '../helpers';
import { setupApplicationTest } from '../helpers/index';

module('Acceptance | settings', function (hooks) {
  setupApplicationTest(hooks);
  resetStorage(hooks, { seed: { source: 'backup', scenario: 'basic' } });

  test('visiting /settings', async function (assert) {
    await visit('/settings');

    assert.strictEqual(currentURL(), '/settings');
  });

  test('settings menu is shown', async function (assert) {
    await visit('/settings');

    assert.dom('[data-test-settings-menu]').exists();
  });

  test('sounds is checked by default', async function (assert) {
    await visit('/settings');

    assert.dom('[data-test-settings-sounds]').isChecked();
  });

  test('theme setting updates when selected', async function (assert) {
    await visit('/settings');
    await click('[data-test-settings-select-theme="light"]');

    const theme = JSON.parse(
      localStorage.getItem('storage:settings')
    ).userTheme;

    assert.strictEqual(theme, 'light');
  });

  // Ember specific tests
  if (!(typeof window !== 'undefined' && window.electronAPI)) {
    test('ember - has six inputs', async function (assert) {
      await visit('/settings');

      assert.dom('[data-test-settings-menu] input').exists({ count: 6 });
    });
  }

  // Electron specific tests
  if (typeof window !== 'undefined' && window.electronAPI) {
    if (window.electronAPI.platform === 'darwin') {
      test('electron:darwin - has seven inputs', async function (assert) {
        await visit('/settings');
        assert.dom('[data-test-settings-menu] input').exists({ count: 7 });
      });
    }

    if (window.electronAPI.platform === 'linux') {
      test('electron:linux - has six inputs', async function (assert) {
        await visit('/settings');
        assert.dom('[data-test-settings-menu] input').exists({ count: 6 });
      });
    }

    // TODO: Figure out number of inputs on windows
    // if (window.electronAPI.platform === 'win32') {
    //   test('electron:win32 - has seven inputs', async function (assert) {
    //     await visit('/settings');
    //     assert.dom('[data-test-settings-menu] input').exists({ count: 7 });
    //   });
    // }

    test('electron - start on startup is not checked by default', async function (assert) {
      await visit('/settings');
      assert.dom('[data-test-settings-startup]').isNotChecked();
    });
  }
});

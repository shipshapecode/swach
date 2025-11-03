import { click, currentURL, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { resetStorage } from 'swach/tests/helpers';
import { setupApplicationTest } from 'swach/tests/helpers/index';

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
    test('ember - has five inputs', async function (assert) {
      await visit('/settings');

      assert.dom('[data-test-settings-menu] input').exists({ count: 5 });
    });
  }

  // Electron specific tests
  if (typeof window !== 'undefined' && window.electronAPI) {
    // TODO: these are different for Mac/Windows vs Linux, so we need specific platform tests
    test('electron - has six inputs', async function (assert) {
      await visit('/settings');
      assert.dom('[data-test-settings-menu] input').exists({ count: 6 });
    });
    test('electron - start on startup is not checked by default', async function (assert) {
      await visit('/settings');
      assert.dom('[data-test-settings-startup]').isNotChecked();
    });
  }
});

import { click, currentURL, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';

import { resetStorage } from 'swach/tests/helpers';
import { setupApplicationTest } from 'swach/tests/helpers/index';

module('Acceptance | settings', function (hooks) {
  setupApplicationTest(hooks);
  resetStorage(hooks, { seed: { source: 'backup', scenario: 'basic' } });

  hooks.beforeEach(async function () {
    await visit('/settings');
  });

  test('visiting /settings', function (assert) {
    assert.strictEqual(currentURL(), '/settings');
  });

  test('settings menu is shown', function (assert) {
    assert.dom('[data-test-settings-menu]').exists();
  });

  test('sounds is checked by default', function (assert) {
    assert.dom('[data-test-settings-sounds]').isChecked();
  });

  test('theme setting updates when selected', async function (assert) {
    await click('[data-test-settings-select-theme="light"]');

    const theme = JSON.parse(
      localStorage.getItem('storage:settings'),
    ).userTheme;

    assert.strictEqual(theme, 'light');
  });

  // Ember specific tests
  if (typeof requireNode === 'undefined') {
    test('has five inputs', function (assert) {
      assert.dom('[data-test-settings-menu] input').exists({ count: 5 });
    });
  }

  // Electron specific tests
  if (typeof requireNode !== 'undefined') {
    // TODO: these are different for Mac/Windows vs Linux, so we need specific platform tests
    // eslint-disable-next-line qunit/no-commented-tests
    // test('has seven inputs', function (assert) {
    //   assert.dom('[data-test-settings-menu] input').exists({ count: 7 });
    // });
    // eslint-disable-next-line qunit/no-commented-tests
    // test('start on startup is not checked by default', async function (assert) {
    //   assert.dom('[data-test-settings-startup]').isNotChecked();
    // });
  }
});

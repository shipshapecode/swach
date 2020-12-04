import { module, test } from 'qunit';
import { click, visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import resetStorages from 'ember-local-storage/test-support/reset-storage';
import seedOrbit from '../orbit/seed';

module('Acceptance | settings', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(async function () {
    await seedOrbit(this.owner);
    await visit('/settings');
  });

  hooks.afterEach(function () {
    resetStorages();
  });

  test('visiting /settings', function (assert) {
    assert.equal(currentURL(), '/settings');
  });

  test('settings menu is shown', function (assert) {
    assert.dom('[data-test-settings-menu]').exists();
  });

  test('sounds is checked by default', function (assert) {
    assert.dom('[data-test-settings-sounds]').isChecked();
  });

  test('theme setting updates when selected', async function (assert) {
    await click('[data-test-settings-select-theme="light"]');
    const theme = JSON.parse(localStorage.getItem('storage:settings'))
      .userTheme;

    assert.equal(theme, 'light');
  });

  // Ember specific tests
  if (typeof requireNode === 'undefined') {
    test('has two checkboxes', function (assert) {
      assert.dom('[data-test-settings-menu] input').exists({ count: 5 });
    });
  }

  // Electron specific tests
  if (typeof requireNode !== 'undefined') {
    test('has four checkboxes', function (assert) {
      assert.dom('[data-test-settings-menu] input').exists({ count: 4 });
    });

    test('start on startup is not checked by default', async function (assert) {
      assert.dom('[data-test-settings-startup]').isNotChecked();
    });
  }
});

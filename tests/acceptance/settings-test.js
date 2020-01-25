import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import resetStorages from 'ember-local-storage/test-support/reset-storage';
import { selectChoose } from 'ember-power-select/test-support';
import seedOrbit from '../orbit/seed';

module('Acceptance | settings', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(async function() {
    await seedOrbit(this.owner);
    await visit('/settings');
  });
  
  hooks.afterEach(function() {
    resetStorages();
  });

  test('visiting /settings', function(assert) {
    assert.equal(currentURL(), '/settings');
  });

  test('settings menu is shown', function(assert) {
    assert.dom('[data-test-settings-menu]').exists();
  });

  test('has two checkboxes', function(assert) {
    assert.dom('[data-test-settings-menu] input').exists({ count: 2 });
  });

  test('start on startup is not checked by default', async function(assert) {
    assert.dom('[data-test-settings-startup]').isNotChecked();
  });

  test('sounds is checked by default', function(assert) {
    assert.dom('[data-test-settings-sounds]').isChecked();
  });

  test('theme setting updates when selected', async function(assert) {
    await selectChoose('[data-test-settings-select-theme]', 'Light');
    const theme = JSON.parse(localStorage.getItem('storage:settings'))
      .userTheme;

    assert.equal(theme, 'light');
  });
});

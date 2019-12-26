import { module, test } from 'qunit';
import { find, findAll, visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import sharedScenario from '../../mirage/scenarios/shared';
import resetStorages from 'ember-local-storage/test-support/reset-storage';
import { selectChoose } from 'ember-power-select/test-support';

module('Acceptance | settings', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function() {
    sharedScenario(this.server);
    await visit('/settings');
  });
  hooks.afterEach(function() {
    resetStorages();
  });

  test('visiting /settings', async function(assert) {
    assert.equal(currentURL(), '/settings');
  });

  test('settings menu is shown', async function(assert) {
    const menu = await find('[data-test-settings-menu]');

    assert.ok(menu);
  });

  test('has two checkboxes', async function(assert) {
    const checkboxes = await findAll('[data-test-settings-menu] input');

    assert.equal(checkboxes.length, 2);
  });

  test('start on startup is not checked by default', async function(assert) {
    const startupCheckbox = await find('[data-test-settings-startup]');

    assert.notOk(startupCheckbox.checked);
  });

  test('sounds is checked by default', async function(assert) {
    const soundsCheckbox = await find('[data-test-settings-sounds]');

    assert.ok(soundsCheckbox.checked);
  });

  test('theme setting updates when selected', async function(assert) {
    await selectChoose('[data-test-settings-select-theme]', 'Light');
    const theme = JSON.parse(localStorage.getItem('storage:settings'))
      .userTheme;

    assert.equal(theme, 'light');
  });
});

import { click, currentURL, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import sinon from 'sinon';

import IDBExportImport from 'indexeddb-export-import';

import { resetStorage, waitForAll } from 'swach/tests/helpers';
import { setupApplicationTest } from 'swach/tests/helpers/index';

module('Acceptance | settings/data', function (hooks) {
  setupApplicationTest(hooks);
  resetStorage(hooks, { seed: { source: 'backup', scenario: 'basic' } });

  hooks.beforeEach(async function () {
    await visit('/settings/data');
  });

  test('visiting /settings/data', async function (assert) {
    assert.strictEqual(currentURL(), '/settings/data');
  });

  test('changing formats', async function (assert) {
    assert
      .dom('[data-test-settings-format-dropdown] [data-test-options-trigger]')
      .hasText('hex');
    await click(
      '[data-test-settings-format-dropdown] [data-test-options-trigger]',
    );

    await waitForAll();

    await click(
      '[data-test-settings-format-dropdown] [data-test-options-content] [data-test-format-option="hsl"]',
    );

    assert
      .dom('[data-test-settings-format-dropdown] [data-test-options-trigger]')
      .hasText('hsl');
  });

  // Electron specific tests
  if (typeof requireNode !== 'undefined') {
    test('export triggers success message', async function (assert) {
      sinon.stub(IDBExportImport, 'exportToJsonString').callsArg(1);
      await click('[data-test-export-swatches-button]');
      await waitForAll();
      assert.dom('.alert.alert-success').exists({ count: 1 });
    });
    test('export triggers error message', async function (assert) {
      sinon
        .stub(IDBExportImport, 'exportToJsonString')
        .callsArgWith(1, 'error');
      await click('[data-test-export-swatches-button]');
      await waitForAll();
      assert.dom('.alert.alert-danger').exists({ count: 1 });
    });
  }
});

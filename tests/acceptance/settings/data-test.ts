import { click, currentURL, visit, waitFor } from '@ember/test-helpers';
import { module, test } from 'qunit';
import sinon from 'sinon';
import IDBExportImport from 'indexeddb-export-import';
import { resetStorage, waitForAll } from 'swach/tests/helpers';
import { setupApplicationTest } from 'swach/tests/helpers/index';

module('Acceptance | settings/data', function (hooks) {
  setupApplicationTest(hooks);
  resetStorage(hooks, { seed: { source: 'backup', scenario: 'basic' } });

  test('visiting /settings/data', async function (assert) {
    await visit('/settings/data');

    assert.strictEqual(currentURL(), '/settings/data');
  });

  test('changing formats', async function (assert) {
    await visit('/settings/data');

    assert
      .dom('[data-test-settings-format-dropdown] [data-test-options-trigger]')
      .hasText('hex');
    await click(
      '[data-test-settings-format-dropdown] [data-test-options-trigger]'
    );

    await waitForAll();

    await click(
      '[data-test-settings-format-dropdown] [data-test-options-content] [data-test-format-option="hsl"]'
    );

    assert
      .dom('[data-test-settings-format-dropdown] [data-test-options-trigger]')
      .hasText('hsl');
  });

  // Electron specific tests
  if (typeof window !== 'undefined' && window.electronAPI) {
    test('export triggers success message', async function (assert) {
      await visit('/settings/data');

      sinon.stub(IDBExportImport, 'exportToJsonString').callsArg(1);
      await click('[data-test-export-swatches-button]');
      await waitForAll();
      await waitFor('.alert.alert-success');
      assert.dom('.alert.alert-success').exists({ count: 1 });
    });
    test('export triggers error message', async function (assert) {
      await visit('/settings/data');

      sinon
        .stub(IDBExportImport, 'exportToJsonString')
        .callsArgWith(1, 'error');
      await click('[data-test-export-swatches-button]');
      await waitForAll();
      await waitFor('.alert.alert-danger');
      assert.dom('.alert.alert-danger').exists({ count: 1 });
    });
  }
});

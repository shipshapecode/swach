import { click, currentURL, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { module, test } from 'qunit';

import resetStorages from 'ember-local-storage/test-support/reset-storage';

import IDBExportImport from 'indexeddb-export-import';
import sinon from 'sinon';

import { waitForAll } from 'swach/tests/helpers';
import seedOrbit from 'swach/tests/orbit/seed';
import * as utils from 'swach/utils/get-db-open-request';

module('Acceptance | settings/data', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(async function () {
    // @ts-expect-error We do not need a real result object here, so missing fields is fine.
    sinon.stub(utils, 'getDBOpenRequest').returns({ result: {} });
    await seedOrbit(this.owner);
    await visit('/settings/data');
  });

  hooks.afterEach(function () {
    resetStorages();
  });

  test('visiting /settings/data', async function (assert) {
    assert.equal(currentURL(), '/settings/data');
  });

  test('changing formats', async function (assert) {
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
  if (typeof requireNode !== 'undefined') {
    // TODO: these only work with embroider and embroider is broken on Windows currently
    // test('export triggers success message', async function (assert) {
    //   sinon.stub(IDBExportImport, 'exportToJsonString').callsArg(1);
    //   await click('[data-test-export-swatches-button]');
    //   await waitForAll();
    //   assert.dom('.alert.alert-success').exists({ count: 1 });
    // });
    // test('export triggers error message', async function (assert) {
    //   sinon
    //     .stub(IDBExportImport, 'exportToJsonString')
    //     .callsArgWith(1, 'error');
    //   await click('[data-test-export-swatches-button]');
    //   await waitForAll();
    //   assert.dom('.alert.alert-danger').exists({ count: 1 });
    // });
  }
});

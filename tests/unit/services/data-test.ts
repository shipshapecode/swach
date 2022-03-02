import { setupTest } from 'ember-qunit';
import { module, test } from 'qunit';

import { Store } from 'ember-orbit';

import { Coordinator } from '@orbit/coordinator';
import IndexedDBSource from '@orbit/indexeddb';

import Palette from 'swach/data-models/palette';
import DataService from 'swach/services/data';
import { resetStorage } from 'swach/tests/helpers';
import seedOrbit from 'swach/tests/orbit/seed';

module('Unit | Service | data', function (hooks) {
  setupTest(hooks);

  let dataService: DataService;
  let dataCoordinator: Coordinator;
  let backup: IndexedDBSource;
  let store: Store;

  hooks.beforeEach(function () {
    dataService = this.owner.lookup('service:data');
    dataCoordinator = this.owner.lookup('service:dataCoordinator');
    backup = dataCoordinator.getSource<IndexedDBSource>('backup');
    store = this.owner.lookup('service:store');
  });

  module('activate', function (hooks) {
    resetStorage(hooks, { seed: { source: 'backup', scenario: 'basic' } });

    test('loads records from backup and syncs them with the store', async function (assert) {
      let backupPalettes = await backup.query<Palette[]>((q) =>
        q.findRecords('palette')
      );

      assert.strictEqual(backupPalettes.length, 4, 'backup source has data');
      assert.strictEqual(
        store.cache.findRecords('palette').length,
        0,
        'store has no data'
      );

      await dataService.activate();

      assert.strictEqual(
        store.cache.findRecords('palette').length,
        4,
        'store has data after activation'
      );
    });
  });

  module('synchronize', function (hooks) {
    resetStorage(hooks);

    test('must be called after `activate`', async function (assert) {
      assert.expect(3);
      assert.notOk(dataService.isActivated);

      try {
        await dataService.synchronize();
      } catch (e) {
        assert.strictEqual(
          e.message,
          'Data service: synchronize cannot be called prior to activate'
        );
      }

      await dataService.activate();
      assert.ok(dataService.isActivated);

      await dataService.synchronize();
    });

    test('will create a color history palette if none exists', async function (assert) {
      await dataService.activate();

      assert.strictEqual(
        store.cache.findRecords('palette').length,
        0,
        'store has no palettes before synchronize'
      );

      await dataService.synchronize();

      let palettes = store.cache.query<Palette[]>((q) =>
        q.findRecords('palette')
      );

      assert.strictEqual(
        palettes.length,
        1,
        'store has one palette after synchronize'
      );

      assert.ok(palettes[0].isColorHistory, 'palette isColorHistory');

      assert.strictEqual(
        dataService.colorHistory,
        palettes[0],
        'colorHistory has been assigned to dataService'
      );
    });

    test('will eliminate extra color history palettes if there are > 1', async function (assert) {
      await dataService.activate();

      const createColorHistory = async () => {
        await store.addRecord<Palette>({
          type: 'palette',
          createdAt: new Date(),
          colorOrder: [],
          isColorHistory: true,
          isFavorite: false,
          isLocked: false,
          selectedColorIndex: 0
        });
      };

      await createColorHistory();
      await createColorHistory();

      assert.strictEqual(
        store.cache.findRecords('palette').length,
        2,
        'store has two color history palettes before synchronize'
      );

      await dataService.synchronize();

      let palettes = store.cache.query<Palette[]>((q) =>
        q.findRecords('palette')
      );

      assert.strictEqual(
        palettes.length,
        1,
        'store has one palette after synchronize'
      );

      assert.ok(palettes[0].isColorHistory, 'palette isColorHistory');

      assert.strictEqual(
        dataService.colorHistory,
        palettes[0],
        'colorHistory has been assigned to dataService'
      );
    });
  });

  module('reset', function () {
    test('clears backup + store', async function (assert) {
      seedOrbit(backup);

      await dataService.activate();
      await dataService.synchronize();

      assert.strictEqual(
        store.cache.findRecords('palette').length,
        4,
        'store has data after activation'
      );
      assert.ok(dataService.colorHistory, 'colorHistory has been defined');

      await dataService.reset();

      assert.strictEqual(
        store.cache.findRecords('palette').length,
        0,
        'store has no data'
      );
      assert.notOk(dataService.colorHistory, 'colorHistory has been cleared');
    });
  });
});

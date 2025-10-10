import { settled } from '@ember/test-helpers';
import { animationsSettled } from 'ember-animated/test-support';
import { waitForSource } from 'ember-orbit/test-support/index';
import { orbitRegistry, setupOrbit } from 'ember-orbit';
import type { IndexedDBSource } from '@orbit/indexeddb';
import type BucketClass from '@orbit/indexeddb-bucket';
import seedOrbit from './orbit/seed';

const dataModels = import.meta.glob('../app/data-models/*.{js,ts}', {
  eager: true,
});
const dataSources = import.meta.glob('../app/data-sources/*.{js,ts}', {
  eager: true,
});
const dataStrategies = import.meta.glob('../app/data-strategies/*.{js,ts}', {
  eager: true,
});

export async function waitForAll() {
  const coordinator = orbitRegistry.services.dataCoordinator;

  for (const source of coordinator.sources) {
    await waitForSource(source);
  }

  await settled();
  await animationsSettled();
}

export function resetStorage(
  hooks: NestedHooks,
  options: { seed?: { source?: string; scenario?: string } } = {}
) {
  hooks.beforeEach(async function () {
    setupOrbit(this.owner, {
      ...dataModels,
      ...dataSources,
      ...dataStrategies,
    });

    if (options.seed) {
      const sourceName = options.seed.source ?? 'backup';
      const source = orbitRegistry.registrations.sources[sourceName];
      await seedOrbit(source, options.seed.scenario);
    }
  });

  hooks.afterEach(async function () {
    const backup = orbitRegistry.registrations.sources
      .backup as IndexedDBSource;

    await backup.cache.deleteDB();

    const bucket = orbitRegistry.registrations.buckets.main as
      | BucketClass
      | undefined;

    await bucket?.clear();

    self.localStorage.removeItem('storage:settings');
  });
}

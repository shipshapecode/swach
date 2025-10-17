import { getContext, settled } from '@ember/test-helpers';
import { animationsSettled } from 'ember-animated/test-support';
import { waitForSource } from 'ember-orbit/test-support/index';
import { getOrbitRegistry, setupOrbit } from 'ember-orbit';
import type BucketClass from '@orbit/indexeddb-bucket';
import type MemorySource from '@orbit/memory';
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
  // @ts-expect-error This is fine.
  const owner = getContext().owner;
  const orbitRegistry = getOrbitRegistry(owner);
  const coordinator = orbitRegistry.services.dataCoordinator;

  if (coordinator) {
    for (const source of coordinator.sources) {
      await waitForSource(source, owner);
    }
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
      const orbitRegistry = getOrbitRegistry(this.owner);
      const sourceName = options.seed.source ?? 'backup';
      const source = orbitRegistry.registrations.sources[sourceName];
      await seedOrbit(source, options.seed.scenario);
    }
  });

  hooks.afterEach(async function () {
    const orbitRegistry = getOrbitRegistry(this.owner);
    const backup = orbitRegistry.registrations.sources.backup as MemorySource;

    backup.cache.reset();

    const bucket = orbitRegistry.registrations.buckets.main as
      | BucketClass
      | undefined;

    await bucket?.clear();

    self.localStorage.removeItem('storage:settings');
  });
}

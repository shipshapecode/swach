import { getContext, settled } from '@ember/test-helpers';
import { animationsSettled } from 'ember-animated/test-support';
import { waitForSource } from 'ember-orbit/test-support';
import type Owner from '@ember/owner';
import type Coordinator from '@orbit/coordinator';
import type { IndexedDBSource } from '@orbit/indexeddb';
import type BucketClass from '@orbit/indexeddb-bucket';
// @ts-expect-error TODO: not yet typed
import seedOrbit from './orbit/seed';

export async function waitForAll() {
  const { owner } = getContext() as { owner: Owner };
  // @ts-expect-error Not sure why it says this does not exist
  const { services } = owner.resolveRegistration('ember-orbit:config') as {
    services: {
      coordinator: string;
    };
  };
  const coordinator = owner.lookup(
    `service:${services.coordinator}`,
  ) as unknown as Coordinator;

  for (const source of coordinator.sources) {
    await waitForSource(source);
  }

  await settled();
  await animationsSettled();
}

export function resetStorage(
  hooks: NestedHooks,
  options: { seed?: { source?: string; scenario?: string } } = {},
) {
  hooks.beforeEach(async function () {
    if (options.seed) {
      const sourceName = options.seed.source ?? 'backup';
      const source = this.owner.lookup(`data-source:${sourceName}`);

      await seedOrbit(source, options.seed.scenario);
    }
  });

  hooks.afterEach(async function () {
    const backup = this.owner.lookup('data-source:backup') as IndexedDBSource;

    await backup.cache.deleteDB();

    const bucket = this.owner.lookup('data-bucket:main') as
      | BucketClass
      | undefined;

    await bucket?.clear();

    self.localStorage.removeItem('storage:settings');
  });
}

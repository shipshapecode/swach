import { getContext, settled } from '@ember/test-helpers';

import { animationsSettled } from 'ember-animated/test-support';
import { waitForSource } from 'ember-orbit/test-support';

import seedOrbit from './orbit/seed';

export async function waitForAll() {
  const { owner } = getContext();
  const { services } = owner.resolveRegistration('ember-orbit:config');
  const coordinator = owner.lookup(`service:${services.coordinator}`);

  for (let source of coordinator.sources) {
    await waitForSource(source);
  }

  await settled();
  await animationsSettled();
}

export function resetStorage(hooks, options = {}) {
  hooks.beforeEach(async function () {
    if (options.seed) {
      const sourceName = options.seed.source ?? 'backup';
      const source = this.owner.lookup(`data-source:${sourceName}`);

      await seedOrbit(source, options.seed.scenario);
    }
  });

  hooks.afterEach(async function () {
    const backup = this.owner.lookup('data-source:backup');

    await backup.cache.deleteDB();

    const bucket = this.owner.lookup('data-bucket:main');

    await bucket?.clear();

    self.localStorage.removeItem('storage:settings');
  });
}

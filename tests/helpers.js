import { getContext, settled } from '@ember/test-helpers';
import { animationsSettled } from 'ember-animated/test-support';
import { waitForSource } from 'ember-orbit/test-support';

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

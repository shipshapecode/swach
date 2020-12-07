import { getContext, settled } from '@ember/test-helpers';
import { animationsSettled } from 'ember-animated/test-support';
import { waitForSource } from 'ember-orbit/test-support';

/**
 * Allows for easily triggering the context menu to open for testing
 * @param {*} selector
 */
export function triggerContextMenu(selector) {
  const element = document.querySelector(selector);

  const contextMenuEvent = new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: false,
    view: window,
    button: 2,
    buttons: 0,
    clientX: element.getBoundingClientRect().x,
    clientY: element.getBoundingClientRect().y
  });

  element.dispatchEvent(contextMenuEvent);
}

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

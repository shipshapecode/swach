import { isTesting } from '@embroider/macros';

export default function viewTransitions() {
  if (isTesting() || !document.startViewTransition) {
    return;
  }

  return new Promise<void>((resolve) => {
    // eslint-disable-next-line @typescript-eslint/require-await
    const transition = document.startViewTransition(async () => {
      resolve();
    });

    // A transition gets skipped when another starts before it finishes;
    // its `ready`/`finished` promises reject with an AbortError that would
    // otherwise surface as an unhandled rejection.
    transition.ready.catch(() => {});
    transition.finished.catch(() => {});
  });
}

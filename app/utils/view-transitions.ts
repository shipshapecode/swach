export default function viewTransitions() {
  if (!document.startViewTransition) {
    return;
  }

  return new Promise<void>((resolve) => {
    // eslint-disable-next-line @typescript-eslint/require-await
    document.startViewTransition(async () => {
      resolve();
    });
  });
}

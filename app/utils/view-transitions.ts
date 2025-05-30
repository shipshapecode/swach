export default function viewTransitions() {
  if (!document.startViewTransition) {
    return;
  }

  return new Promise<void>((resolve) => {
    document.startViewTransition(async () => {
      resolve();
    });
  });
}

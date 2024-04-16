// Here are the types for the view transition API, but I don't know how to add them to the global scope
// interface ViewTransition {
//   updateCallbackDone: Promise<void>;
//   ready: Promise<void>;
//   finished: Promise<void>;
//   skipTransition: () => void;
// }

// interface Document {
//   startViewTransition(updateCallback: () => Promise<void>): ViewTransition;
// }

export default function viewTransitions() {
  // @ts-expect-error view transition types are not available
  if (!document.startViewTransition) {
    return;
  }

  return new Promise<void>((resolve) => {
    // @ts-expect-error view transition types are not available
    document.startViewTransition(async () => {
      resolve();
    });
  });
}

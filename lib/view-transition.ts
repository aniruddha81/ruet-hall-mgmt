export type RouteTransitionDirection = "forward" | "back";

type DocumentWithTransition = Document & {
  startViewTransition?: (updateCallback: () => void) => {
    finished: Promise<void>;
  };
};

type PushRouter = {
  push: (href: string) => void;
};

export function navigateWithTransition(
  router: PushRouter,
  href: string,
  direction: RouteTransitionDirection,
) {
  const doc = document as DocumentWithTransition;
  document.documentElement.dataset.routeTransition = direction;

  if (!doc.startViewTransition) {
    router.push(href);
    window.setTimeout(() => {
      delete document.documentElement.dataset.routeTransition;
    }, 450);
    return;
  }

  const transition = doc.startViewTransition(() => {
    router.push(href);
  });

  transition.finished.finally(() => {
    delete document.documentElement.dataset.routeTransition;
  });
}

import Component from '@glimmer/component';

import fade from 'ember-animated/transitions/fade';

import { transitionOptions, transitions } from 'swach/transitions';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface AnimatedOutletSignature {}

export default class AnimatedOutlet extends Component<AnimatedOutletSignature> {
  duration = transitionOptions.duration;
  easing = transitionOptions.easing;

  // TODO: correctly type this instead of using `any`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rules({ newItems, oldItems }: { newItems: any[]; oldItems: any[] }): unknown {
    const oldRoute = oldItems[oldItems.length - 1];
    const newRoute = newItems[newItems.length - 1];
    let oldRouteName: string | undefined = undefined;
    let newRouteName: string | undefined = undefined;

    if (oldRoute) {
      oldRouteName = oldRoute.outlets.main.render.name;
    }

    if (newRoute) {
      newRouteName = newRoute.outlets.main.render.name;
    }

    let transition = transitions.find(
      (t) => t.from === oldRouteName && t.to === newRouteName,
    );

    if (transition) {
      return transition.use;
    }

    transition = transitions.find(
      (t) => t.to === oldRouteName && t.from === newRouteName,
    );

    if (transition) {
      return transition.reverse || transition.use;
    }

    if (oldRouteName !== newRouteName) {
      return fade;
    }
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    AnimatedOutlet: typeof AnimatedOutlet;
  }
}

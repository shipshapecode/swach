import Component from '@glimmer/component';

import fade from 'ember-animated/transitions/fade';

import { transitionOptions, transitions } from 'swach/transitions';

export default class AnimatedOutlet extends Component {
  duration = transitionOptions.duration;
  easing = transitionOptions.easing;

  rules({ newItems, oldItems }: { newItems: any[]; oldItems: any[] }): unknown {
    const oldRoute = oldItems[oldItems.length - 1];
    const newRoute = newItems[newItems.length - 1];
    let oldRouteName: string, newRouteName: string;

    if (oldRoute) {
      oldRouteName = oldRoute.outlets.main.render.name;
    }

    if (newRoute) {
      newRouteName = newRoute.outlets.main.render.name;
    }

    let transition = transitions.find(
      (t) => t.from === oldRouteName && t.to === newRouteName
    );

    if (transition) {
      return transition.use;
    }

    transition = transitions.find(
      (t) => t.to === oldRouteName && t.from === newRouteName
    );

    if (transition) {
      return transition.reverse || transition.use;
    }

    return fade;
  }
}

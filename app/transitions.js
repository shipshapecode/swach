import { toLeft, toRight } from 'ember-animated/transitions/move-over';
import { easeInAndOut } from 'ember-animated/easings/cosine';

export const transitionOptions = { duration: 250, easing: easeInAndOut };

export const transitions = [
  {
    from: 'welcome.index',
    to: 'welcome.auto-start',
    use: toLeft,
    reverse: toRight
  },
  {
    from: 'welcome.auto-start',
    to: 'welcome.dock-icon',
    use: toLeft,
    reverse: toRight
  }
];

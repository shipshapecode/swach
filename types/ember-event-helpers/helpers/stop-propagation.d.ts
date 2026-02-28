import { HelperLike } from '@glint/template';

declare module 'ember-event-helpers/helpers/stop-propagation' {
  export default HelperLike<{
    Args: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Positional: [eventHandler: (event: Event) => any];
    };
    Return: (event: Event) => void;
  }>;
}

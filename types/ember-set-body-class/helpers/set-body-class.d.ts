import { HelperLike } from '@glint/template';

declare module 'ember-set-body-class/helpers/set-body-class' {
  export default HelperLike<{
    Args: {
      Positional: [className: string];
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Return: any;
  }>
}

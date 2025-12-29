import { HelperLike } from '@glint/template';

declare module 'ember-set-body-class/helpers/set-body-class' {
  export default HelperLike<{
    Args: {
      Positional: [className: string];
    };
    Return: any;
  }>
}

import Component from '@glimmer/component';

interface LoadingButtonSignature {
  Element: HTMLButtonElement;
  Args: { loading: boolean; onClick: () => void };
  Blocks: {
    default: [];
  };
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class LoadingButton extends Component<LoadingButtonSignature> {}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    LoadingButton: typeof LoadingButton;
  }
}

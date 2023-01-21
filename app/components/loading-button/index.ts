import templateOnlyComponent from '@ember/component/template-only';

interface LoadingButtonSignature {
  Element: HTMLButtonElement;
  Args: { loading: boolean; onClick: () => void };
  Blocks: {
    default: [];
  };
}

const LoadingButton = templateOnlyComponent<LoadingButtonSignature>();

export default LoadingButton;

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    LoadingButton: typeof LoadingButton;
  }
}

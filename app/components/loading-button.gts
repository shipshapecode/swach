import { on } from '@ember/modifier';
import Component from '@glimmer/component';

interface LoadingButtonSignature {
  Element: HTMLButtonElement;
  Args: { loading: boolean; onClick: () => void };
  Blocks: {
    default: [];
  };
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class LoadingButton extends Component<LoadingButtonSignature> {
  <template>
    <button
      class="btn btn-primary h-10 leading-5 pl-2 pr-2 w-full disabled:opacity-50"
      disabled={{@loading}}
      type="button"
      {{on "click" @onClick}}
      ...attributes
    >
      <div
        class="flex h-full items-center justify-center overflow-hidden relative w-full"
      >
        {{#if @loading}}
          <div class="dot-typing"></div>
        {{else}}
          {{yield}}
        {{/if}}
      </div>
    </button>
  </template>
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    LoadingButton: typeof LoadingButton;
  }
}

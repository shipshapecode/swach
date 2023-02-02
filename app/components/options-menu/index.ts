import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

interface OptionsMenuSignature {
  Element: HTMLDivElement;
  Args: {
    optionsClasses?: string;
    position?: 'left' | 'right';
    showBackground?: boolean;
    triggerClasses?: string;
  };
  Blocks: { content: []; trigger: [] };
}

export default class OptionsMenu extends Component<OptionsMenuSignature> {
  @tracked position: 'left' | 'right' = 'right';
  @tracked isShown = false;

  constructor(owner: unknown, args: OptionsMenuSignature['Args']) {
    super(owner, args);

    this.position = this.args.position ?? 'right';
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    OptionsMenu: typeof OptionsMenu;
  }
}

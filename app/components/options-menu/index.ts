import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

interface OptionsMenuArgs {
  position: 'left' | 'right';
  showBackground: boolean;
}

export default class OptionsMenu extends Component<OptionsMenuArgs> {
  @tracked position: 'left' | 'right' = 'right';
  @tracked isShown = false;

  constructor(owner: unknown, args: OptionsMenuArgs) {
    super(owner, args);

    this.position = this.args.position ?? 'right';
  }
}

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

  async cancel() {
    if (this.options.confirmCancel) {
      const confirmCancelIsFunction =
        typeof this.options.confirmCancel === 'function';
      const cancelMessage =
        this.options.confirmCancelMessage ||
        'Are you sure you want to stop the tour?';
      const stopTour = confirmCancelIsFunction
        ? await this.options.confirmCancel()
        : window.confirm(cancelMessage);
      if (stopTour) {
        this._done('cancel');
      }
    } else {
      this._done('cancel');
    }
  }
}

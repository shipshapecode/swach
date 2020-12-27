import { action } from '@ember/object';
import Component from '@glimmer/component';

export default class ContextMenuItemComponent extends Component {
  get _amount() {
    return !this._isParent && this.args.amount > 1 && this.args.amount;
  }

  get _isParent() {
    const { subActions } = this.args.item;
    return subActions ? subActions.length : 0;
  }

  get isDisabled() {
    return this.args.itemIsDisabled(this.args.item);
  }

  @action
  itemClicked() {
    if (!this.isDisabled && !this._isParent) {
      this.args.clickAction(this.args.item);
    }
  }
}

/* eslint-disable ember/no-computed-properties-in-native-classes */
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { htmlSafe } from '@ember/string';
import Component from '@glimmer/component';

export default class ContextMenuComponent extends Component {
  @service contextMenu;

  @reads('contextMenu.isActive') isActive;
  @reads('contextMenu.renderLeft') renderLeft;
  @reads('contextMenu.items') items;
  @reads('contextMenu.selection') _selection;
  @reads('contextMenu.details') details;
  @reads('contextMenu.event') clickEvent;

  get selection() {
    return [].concat(this._selection);
  }

  @computed('contextMenu.position.{left,top}')
  get position() {
    let { left, top } = this.contextMenu?.position || {};
    return htmlSafe(`left: ${left}px; top: ${top}px;`);
  }

  get itemIsDisabled() {
    let selection = this.selection || [];
    let details = this.details;

    return function (item) {
      let disabled = item.disabled;

      if (!item.action && !item.subActions) {
        return true;
      }

      if (typeof disabled === 'function') {
        return disabled(selection, details);
      }

      return disabled;
    };
  }

  get clickAction() {
    let selection = this.selection;
    let details = this.details;
    let event = this.clickEvent;

    return function (item) {
      if (typeof item.action === 'function') {
        item.action(selection, details, event);
      }
    };
  }
}

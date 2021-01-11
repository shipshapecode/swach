import invokeAction from 'ember-invoke-action';

import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { htmlSafe } from '@ember/string';
import { reads } from '@ember/object/computed';
import { computed, get } from '@ember/object';

export default class ContextMenuComponent extends Component {
  @service contextMenu;

  @reads('contextMenu.isActive') isActive;
  @reads('contextMenu.renderLeft') renderLeft;
  @reads('contextMenu.items') items;
  @reads('contextMenu.selection') _selection;
  @reads('contextMenu.details') details;
  @reads('contextMenu.event') clickEvent;

  @computed('_selection.[]')
  get selection() {
    return [].concat(this._selection);
  }

  get position() {
    let { left, top } = this.contextMenu?.position || {};
    return htmlSafe(`left: ${left}px; top: ${top}px;`);
  }

  setWormholeTarget() {
    let id = 'wormhole-context-menu';
    let target = document.querySelectorAll(`#${id}`);
    if (target.length === 0) {
      document.body.insertAdjacentHTML('beforeend', `<div id="${id}"></div>`);
    }
  }

  get itemIsDisabled() {
    let selection = get(this, 'selection') || [];
    let details = get(this, 'details');

    return function (item) {
      let disabled = get(item, 'disabled');

      if (!get(item, 'action') && !get(item, 'subActions')) {
        return true;
      }

      if (typeof disabled === 'function') {
        return disabled(selection, details);
      }

      return disabled;
    };
  }

  get clickAction() {
    let selection = get(this, 'selection');
    let details = get(this, 'details');
    let event = get(this, 'clickEvent');

    return function (item) {
      invokeAction(item, 'action', selection, details, event);
    };
  }
}

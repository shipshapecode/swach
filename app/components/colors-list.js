import Component from '@ember/component';
import { action, computed } from '@ember/object';
import { tagName } from '@ember-decorators/component';

@tagName('')
export default class ColorsList extends Component {
  @computed('colors.@each.createdAt')
  get sortedColors() {
    return this.colors.sortBy('createdAt').reverse();
  }

  @action
  deleteColor(color) {
    color.destroyRecord();
  }
}

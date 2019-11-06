import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class ColorsList extends Component {
  get sortedColors() {
    return this.args.colors.sortBy('createdAt').reverse();
  }

  @action
  deleteColor(color) {
    color.destroyRecord();
  }
}

import Component from '@ember/component';
import { action } from '@ember/object';
import { tagName } from '@ember-decorators/component';
import { storageFor } from 'ember-local-storage';

@tagName('')
export default class ColorsList extends Component {
  @storageFor('colors') colors;

  @action
  deleteColor(color) {
    this.colors.removeObject(color);
  }
}

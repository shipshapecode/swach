import Component from '@ember/component';
import { tagName } from '@ember-decorators/component';
import { storageFor } from 'ember-local-storage';

@tagName('')
export default class ColorsList extends Component {
  @storageFor('colors') colors;
}

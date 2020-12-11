import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class SettingsMenu extends Component {
  @tracked version = 'Version not available';

  @action
  visitWebsite(event) {
    event.preventDefault();
    if (typeof requireNode !== 'undefined') {
      requireNode('electron').shell.openExternal('https://swach.io/');
    }
  }
}

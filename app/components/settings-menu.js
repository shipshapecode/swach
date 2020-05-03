import Component from '@glimmer/component';
import { action, set } from '@ember/object';
import { storageFor } from 'ember-local-storage';

export default class SettingsMenu extends Component {
  @storageFor('settings') settings;

  themes = ['dynamic', 'light', 'dark'];

  get version() {
    if (typeof requireNode !== 'undefined') {
      return requireNode('electron').remote.app.getVersion();
    }

    return 'Version not available';
  }

  @action
  changeTheme(theme) {
    set(this, 'settings.userTheme', theme);
  }

  @action
  visitWebsite(event) {
    event.preventDefault();
    if (typeof requireNode !== 'undefined') {
      requireNode('electron').shell.openExternal('https://swach.io/');
    }
  }
}

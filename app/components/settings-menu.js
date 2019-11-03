import Component from '@ember/component';
import { action, set } from '@ember/object';
import { tagName } from '@ember-decorators/component';
import { storageFor } from 'ember-local-storage';

@tagName('')
export default class SettingsMenu extends Component {
  @storageFor('settings') settings;

  init() {
    super.init(...arguments);

    set(this, 'themes', ['dynamic', 'light', 'dark']);
  }

  @action
  changeTheme(theme) {
    this.set('settings.userTheme', theme);
  }
}


import Component from '@glimmer/component';
import { action, set } from '@ember/object';
import { storageFor } from 'ember-local-storage';

export default class SettingsMenu extends Component {
  @storageFor('settings') settings;

  themes = ['dynamic', 'light', 'dark'];

  @action
  changeTheme(theme) {
    set(this, 'settings.userTheme', theme);
  }
}

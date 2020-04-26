import Component from '@glimmer/component';
import { action, get, set } from '@ember/object';
import { storageFor } from 'ember-local-storage';

export default class SettingsMenu extends Component {
  @storageFor('settings') settings;

  themes = ['dynamic', 'light', 'dark'];

  constructor() {
    super(...arguments);

    if (typeof requireNode !== 'undefined') {
      let { ipcRenderer } = requireNode('electron');
      this.ipcRenderer = ipcRenderer;
    }
  }

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
  toggleShowDockIcon(event) {
    const showDockIcon = event.target.checked;
    set(this, 'settings.showDockIcon', showDockIcon);
    this.ipcRenderer.send('setShowDockIcon', showDockIcon);
  }

  @action
  visitWebsite(event) {
    event.preventDefault();
    if (typeof requireNode !== 'undefined') {
      requireNode('electron').shell.openExternal('https://swach.io/');
    }
  }
}

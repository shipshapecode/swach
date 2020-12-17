import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action, set } from '@ember/object';
import { storageFor } from 'ember-local-storage';

export default class SettingsMenu extends Component {
  @storageFor('settings') settings;

  themes = ['dynamic', 'light', 'dark'];

  @tracked platform = null;

  constructor() {
    super(...arguments);

    if (typeof requireNode !== 'undefined') {
      let { ipcRenderer } = requireNode('electron');
      this.ipcRenderer = ipcRenderer;

      this.ipcRenderer.invoke('getPlatform').then((platform) => {
        this.platform = platform;
      });
    }
  }

  get isMacOS() {
    return this.platform === 'darwin';
  }

  get isMacOSOrWindows() {
    return this.platform === 'darwin' || this.platform === 'win32';
  }

  @action
  changeTheme(theme) {
    set(this, 'settings.userTheme', theme);
  }
}

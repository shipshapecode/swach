import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action, set } from '@ember/object';
import { inject as service } from '@ember/service';
import { storageFor } from 'ember-local-storage';

export default class SettingsMenu extends Component {
  @service dataCoordinator;
  @service store;
  @storageFor('settings') settings;

  themes = ['dynamic', 'light', 'dark'];

  @tracked isExporting = false;
  @tracked isImporting = false;
  @tracked platform = null;

  constructor() {
    super(...arguments);

    if (typeof requireNode !== 'undefined') {
      let { ipcRenderer } = requireNode('electron');
      this.ipcRenderer = ipcRenderer;

      this.ipcRenderer.invoke('getAppVersion').then((version) => {
        this.version = version;
      });

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

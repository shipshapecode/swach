import Controller from '@ember/controller';
import { action, set } from '@ember/object';
import { inject as service } from '@ember/service';

export default class ApplicationController extends Controller {
  @service() store;

  theme = 'light';

  init() {
    super.init(...arguments);

    let { ipcRenderer } = requireNode('electron');
    this.ipcRenderer = ipcRenderer;

    window.__setTheme = this.setTheme.bind(this);
    this.setTheme();
  }

  @action
  launchPicker() {
    this.ipcRenderer.send('launchPicker');
  }

  @action
  showPreferences() {
    this.ipcRenderer.send('showPreferences');
  }

  setTheme() {
    let userTheme = localStorage.user_theme;
    let OSTheme = localStorage.os_theme;

    set(this, 'theme', userTheme || OSTheme || 'light');
  }
}

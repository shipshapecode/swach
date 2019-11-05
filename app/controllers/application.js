import Controller from '@ember/controller';
import { action, computed, get, set } from '@ember/object';
import { inject as service } from '@ember/service';
import { storageFor } from 'ember-local-storage';

export default class ApplicationController extends Controller {
  @service() store;

  @storageFor('settings') settings;

  @computed('settings.osTheme', 'settings.userTheme')
  get theme() {
    let userTheme = get(this, 'settings.userTheme');
    let OSTheme = get(this, 'settings.osTheme');

    if (userTheme !== 'dynamic') {
      return userTheme;
    }

    return OSTheme || 'light';
  }

  init() {
    super.init(...arguments);

    let { ipcRenderer } = requireNode('electron');
    this.ipcRenderer = ipcRenderer;

    this.ipcRenderer.on('setTheme', (event, theme) => {
      set(this, 'settings.osTheme', theme);
    });
  }

  @action
  exitApp() {
    this.ipcRenderer.send('exitApp');
  }

  @action
  launchPicker() {
    this.ipcRenderer.send('launchPicker');
  }

  @action
  showPreferences() {
    this.ipcRenderer.send('showPreferences');
  }
}

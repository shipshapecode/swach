import Controller from '@ember/controller';
import { action, set } from '@ember/object';
import { storageFor } from 'ember-local-storage';
import colorNameList from 'color-name-list';
import nearestColor from 'nearest-color';

export default class ApplicationController extends Controller {
  theme = 'light';

  @storageFor('colors') colors;

  init() {
    super.init(...arguments);

    window.__setTheme = this.setTheme.bind(this);
    this.setTheme();

    const namedColors = colorNameList.reduce((o, { name, hex }) => Object.assign(o, { [name]: hex }), {});

    const nearest = nearestColor.from(namedColors);
    let { ipcRenderer } = requireNode('electron');
    this.ipcRenderer = ipcRenderer;
    this.ipcRenderer.on('changeColor', (event, color) => {
      const namedColor = nearest(color);

      this.colors.unshiftObject({
        hex: color,
        name: namedColor.name
      });
    });
  }

  @action
  launchPicker() {
    this.ipcRenderer.send('launchPicker');
  }

  setTheme() {
    let userTheme = localStorage.user_theme;
    let OSTheme = localStorage.os_theme;

    set(this, 'theme', userTheme || OSTheme || 'light');
  }
}

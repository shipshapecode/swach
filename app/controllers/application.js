import Controller from '@ember/controller';
import { action, computed, get, set } from '@ember/object';
import { equal } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { storageFor } from 'ember-local-storage';
import { tracked } from '@glimmer/tracking';

export default class ApplicationController extends Controller {
  @service colorUtils;
  @service router;
  @service store;

  @tracked menuIsShown = false;
  @tracked showFavorites = false;

  @storageFor('settings') settings;

  @equal('router.currentRouteName', 'contrast') isContrastRoute;
  @equal('router.currentRouteName', 'kuler') isKulerRoute;
  @equal('router.currentRouteName', 'palettes') isPalettesRoute;
  @equal('router.currentRouteName', 'settings') isSettingsRoute;

  @computed('isContrastRoute', 'isSettingsRoute')
  get showEyedropperIcon() {
    return !this.isContrastRoute && !this.isSettingsRoute;
  }

  @computed('isPalettesRoute')
  get showFavoritesIcon() {
    return this.isPalettesRoute;
  }

  @computed('settings.{osTheme,userTheme}')
  get theme() {
    let userTheme = get(this, 'settings.userTheme');
    let OSTheme = get(this, 'settings.osTheme');

    if (userTheme && userTheme !== 'dynamic') {
      return userTheme;
    }

    return OSTheme || 'light';
  }

  init() {
    super.init(...arguments);

    if (typeof requireNode !== 'undefined') {
      let { ipcRenderer } = requireNode('electron');
      this.ipcRenderer = ipcRenderer;

      this.ipcRenderer.on('changeColor', async (event, color) => {
        const addedColor = await this.addColor(color);
        this.colorUtils.copyColorToClipboard(addedColor);
      });

      this.ipcRenderer.on('setTheme', (event, theme) => {
        set(this, 'settings.osTheme', theme);
      });
    }
  }

  @action
  async addColor(color) {
    const colorRecord = this.colorUtils.createColorRecord(color);

    await colorRecord.save();

    const palettes = await this.store.findAll('palette');
    const colorHistory = palettes.findBy('isColorHistory', true);
    colorHistory.colors.pushObject(colorRecord);
    await colorHistory.save();

    return colorRecord;
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

  @action
  toggleMenuIsShown() {
    this.menuIsShown = !this.menuIsShown;
  }
}

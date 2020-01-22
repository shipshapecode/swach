import Controller from '@ember/controller';
import { action, computed, get, set } from '@ember/object';
import { equal } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { storageFor } from 'ember-local-storage';
import { tracked } from '@glimmer/tracking';

export default class ApplicationController extends Controller {
  @service colorUtils;
  @service dataSchema;
  @service router;
  @service store;
  @service undoManager;

  @tracked menuIsShown = false;

  @storageFor('settings') settings;

  @equal('router.currentRouteName', 'contrast') isContrastRoute;
  @equal('router.currentRouteName', 'kuler') isKulerRoute;
  @equal('router.currentRouteName', 'palettes') isPalettesRoute;
  @equal('router.currentRouteName', 'settings') isSettingsRoute;

  @computed('isContrastRoute', 'isSettingsRoute')
  get showColorWheel() {
    return !this.isContrastRoute && !this.isSettingsRoute;
  }

  @computed('isContrastRoute', 'isSettingsRoute')
  get showEyedropperIcon() {
    return !this.isContrastRoute && !this.isSettingsRoute;
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

      // We have to initially set this, in case somehow the checkbox gets out of sync
      const shouldEnableAutoStart = get(this, 'settings.openOnStartup');
      this.ipcRenderer.send('enableDisableAutoStart', shouldEnableAutoStart);
    }
  }

  @action
  async addColor(color) {
    const palettes = await this.store.find('palette');
    const colorHistory = palettes.findBy('isColorHistory', true);

    const colorPOJO = await this.colorUtils.createColorPOJO(color);
    colorPOJO.id = this.dataSchema.generateId('color');

    await this.store.update(t => {
      return [
        t.addRecord(colorPOJO),
        t.addToRelatedRecords(
          { type: 'palette', id: colorHistory.id },
          'colors',
          { type: 'color', id: colorPOJO.id }
        )
      ];
    });

    this.undoManager.setupUndoRedo();

    return await this.store.find('color', colorPOJO.id);
  }

  @action
  checkForUpdates() {
    this.ipcRenderer.send('checkForUpdates');
  }

  @action
  enableDisableAutoStart(event) {
    this.ipcRenderer.send('enableDisableAutoStart', event.target.checked);
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
  toggleMenuIsShown() {
    this.menuIsShown = !this.menuIsShown;
  }
}

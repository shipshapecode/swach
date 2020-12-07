import Controller from '@ember/controller';
import { action, get, set } from '@ember/object';
import { inject as service } from '@ember/service';
import { storageFor } from 'ember-local-storage';
import { tracked } from '@glimmer/tracking';

export default class ApplicationController extends Controller {
  @service colorUtils;
  @service dataSchema;
  @service router;
  @service store;
  @service undoManager;

  @tracked colorPickerColor = null;
  @tracked colorPickerIsShown = false;
  @tracked menuIsShown = false;

  @storageFor('settings') settings;

  get isContrastRoute() {
    return this.router.currentRouteName === 'contrast';
  }

  get isKulerRoute() {
    return this.router.currentRouteName === 'kuler';
  }

  get isPalettesRoute() {
    return this.router.currentRouteName === 'palettes';
  }

  get isSettingsRoute() {
    return this.router.currentRouteName === 'settings';
  }

  get isWelcomeRoute() {
    return this.router.currentRouteName.includes('welcome');
  }

  get showColorWheel() {
    return (
      !this.isContrastRoute && !this.isSettingsRoute && !this.isWelcomeRoute
    );
  }

  get showEyedropperIcon() {
    return (
      !this.isContrastRoute && !this.isSettingsRoute && !this.isWelcomeRoute
    );
  }

  get theme() {
    let userTheme = get(this, 'settings.userTheme'); // eslint-disable-line ember/no-get
    let OSTheme = get(this, 'settings.osTheme'); // eslint-disable-line ember/no-get

    if (userTheme && userTheme !== 'dynamic') {
      return userTheme;
    }

    return OSTheme || 'light';
  }

  constructor() {
    super(...arguments);

    if (typeof requireNode !== 'undefined') {
      let { ipcRenderer } = requireNode('electron');

      this.ipcRenderer = ipcRenderer;

      this.ipcRenderer.on('changeColor', async (event, color) => {
        const addedColor = await this.addColor(color);
        this.colorUtils.copyColorToClipboard(addedColor);
      });

      this.ipcRenderer.on('openContrastChecker', () => {
        this.router.transitionTo('contrast');
      });

      this.ipcRenderer.on('setTheme', (event, theme) => {
        set(this, 'settings.osTheme', theme);
      });

      // We have to initially set this, in case somehow the checkbox gets out of sync
      const shouldEnableAutoStart = get(this, 'settings.openOnStartup'); // eslint-disable-line ember/no-get
      this.ipcRenderer.send('enableDisableAutoStart', shouldEnableAutoStart);

      this.ipcRenderer
        .invoke('getStoreValue', 'showDockIcon')
        .then((showDockIcon) => {
          set(this, 'settings.showDockIcon', showDockIcon);
        });

      this.ipcRenderer.invoke('getShouldUseDarkColors').then((theme) => {
        set(this, 'settings.osTheme', theme);
      });
    }
  }

  @action
  async addColor(color) {
    const palettes = await this.store.find('palette');
    const colorHistory = palettes.findBy('isColorHistory', true);

    const colorPOJO = this.colorUtils.createColorPOJO(color);
    colorPOJO.id = this.dataSchema.generateId('color');

    await this.store.update((t) => {
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
  toggleColorPickerIsShown(color) {
    if (color && color.hex) {
      this.colorPickerColor = color;
    }
    this.colorPickerIsShown = !this.colorPickerIsShown;
  }

  @action
  toggleMenuIsShown() {
    this.menuIsShown = !this.menuIsShown;
  }

  @action
  toggleShowDockIcon(event) {
    const showDockIcon = event.target.checked;
    set(this, 'settings.showDockIcon', showDockIcon);
    this.ipcRenderer.send('setShowDockIcon', showDockIcon);
  }
}

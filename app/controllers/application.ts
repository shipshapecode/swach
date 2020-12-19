import Controller from '@ember/controller';
import { A } from '@ember/array';
import { action, get, set } from '@ember/object';
import { inject as service } from '@ember/service';
import { storageFor } from 'ember-local-storage';
import { tracked } from '@glimmer/tracking';
import { Model, Store } from 'ember-orbit';
import Router from '@ember/routing/router-service';
import ColorUtils from 'swach/services/color-utils';
import UndoManager from 'swach/services/undo-manager';
import ColorModel from 'swach/data-models/color';

export default class ApplicationController extends Controller {
  @service colorUtils!: ColorUtils;
  @service dataSchema!: any;
  @service router!: Router;
  @service store!: Store;
  @service undoManager!: UndoManager;

  ipcRenderer: any;

  @tracked colorPickerColor?: ColorModel;
  @tracked colorPickerIsShown = false;
  @tracked menuIsShown = false;

  @storageFor('settings') settings?: {
    osTheme: string;
    showDockIcon: boolean;
    userTheme: string;
  };

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
    // @ts-ignore
    let userTheme = get(this, 'settings.userTheme'); // eslint-disable-line ember/no-get
    // @ts-ignore
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

      this.ipcRenderer.on('changeColor', async (_event: any, color: string) => {
        const addedColor = await this.addColor(color);
        if (addedColor) {
          this.colorUtils.copyColorToClipboard(addedColor);
        }
      });

      this.ipcRenderer.on('openContrastChecker', () => {
        this.router.transitionTo('contrast');
      });

      this.ipcRenderer.on('setTheme', (_event: any, theme: string) => {
        // @ts-ignore
        set(this, 'settings.osTheme', theme);
      });

      // @ts-ignore
      // We have to initially set this, in case somehow the checkbox gets out of sync
      const shouldEnableAutoStart = get(this, 'settings.openOnStartup'); // eslint-disable-line ember/no-get
      this.ipcRenderer.send('enableDisableAutoStart', shouldEnableAutoStart);

      this.ipcRenderer
        .invoke('getStoreValue', 'showDockIcon')
        .then((showDockIcon: boolean) => {
          // @ts-ignore
          set(this, 'settings.showDockIcon', showDockIcon);
        });

      this.ipcRenderer
        .invoke('getShouldUseDarkColors')
        .then((theme: string) => {
          // @ts-ignore
          set(this, 'settings.osTheme', theme);
        });
    }
  }

  @action
  async addColor(color: string): Promise<ColorModel | undefined> {
    const palettes = (await this.store.find('palette')) as Model[];
    const colorHistory = A(palettes).findBy('isColorHistory', true);

    if (colorHistory) {
      const colorPOJO = this.colorUtils.createColorPOJO(color);
      colorPOJO.id = this.dataSchema.generateId('color');

      if (colorPOJO?.id) {
        await this.store.update((t) => {
          return [
            t.addRecord(colorPOJO),
            t.addToRelatedRecords(
              { type: 'palette', id: colorHistory.id },
              'colors',
              { type: 'color', id: String(colorPOJO.id) }
            )
          ];
        });

        this.undoManager.setupUndoRedo();

        return (await this.store.find('color', colorPOJO.id)) as ColorModel;
      }
    }
  }

  @action
  checkForUpdates() {
    this.ipcRenderer.send('checkForUpdates');
  }

  @action
  enableDisableAutoStart(e: InputEvent) {
    this.ipcRenderer.send(
      'enableDisableAutoStart',
      (<HTMLInputElement>e.target).checked
    );
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
  toggleColorPickerIsShown(color: ColorModel) {
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
  toggleShowDockIcon(e: InputEvent) {
    const showDockIcon = (<HTMLInputElement>e.target).checked;
    // @ts-ignore
    set(this, 'settings.showDockIcon', showDockIcon);
    this.ipcRenderer.send('setShowDockIcon', showDockIcon);
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your controllers.
declare module '@ember/controller' {
  interface Registry {
    application: ApplicationController;
  }
}

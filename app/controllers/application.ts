import Controller from '@ember/controller';
import { action, get } from '@ember/object';
import type Router from '@ember/routing/router-service';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

import type FlashMessageService from 'ember-cli-flash/services/flash-messages';
import { storageFor } from 'ember-local-storage';
import type { Store } from 'ember-orbit';
import type Session from 'ember-simple-auth/services/session';

import type { RecordSchema } from '@orbit/records';
import type { IpcRenderer } from 'electron';

import type ColorModel from 'swach/data-models/color';
import type ColorUtils from 'swach/services/color-utils';
import type DataService from 'swach/services/data';
import type UndoManager from 'swach/services/undo-manager';
import type { SettingsStorage, themes } from 'swach/storages/settings';

export default class ApplicationController extends Controller {
  @service declare colorUtils: ColorUtils;
  @service declare data: DataService;
  @service declare dataSchema: RecordSchema;
  @service flashMessages!: FlashMessageService;
  @service declare router: Router;
  @service declare session: Session;
  @service declare store: Store;
  @service declare undoManager: UndoManager;

  @storageFor('settings') settings!: SettingsStorage;

  declare ipcRenderer: IpcRenderer;

  @tracked colorPickerColor?: ColorModel;
  @tracked colorPickerIsShown = false;

  get hasLoggedInBeforeAndIsAuthenticated(): boolean {
    // eslint-disable-next-line ember/no-get
    const userHasLoggedInBefore = get(this.settings, 'userHasLoggedInBefore');

    return (
      !userHasLoggedInBefore ||
      (userHasLoggedInBefore && this.session.isAuthenticated)
    );
  }

  get isContrastRoute(): boolean {
    return this.router.currentRouteName === 'contrast';
  }

  get isKulerRoute(): boolean {
    return this.router.currentRouteName === 'kuler';
  }

  get isPalettesRoute(): boolean {
    return this.router.currentRouteName === 'palettes';
  }

  get isSettingsRoute(): boolean {
    return this.router.currentRouteName === 'settings';
  }

  get isWelcomeRoute(): boolean {
    return this.router.currentRouteName.includes('welcome');
  }

  get showColorWheel(): boolean {
    return (
      this.hasLoggedInBeforeAndIsAuthenticated &&
      !this.isContrastRoute &&
      !this.isSettingsRoute &&
      !this.isWelcomeRoute
    );
  }

  get showEyedropperIcon(): boolean {
    return (
      this.hasLoggedInBeforeAndIsAuthenticated &&
      !this.isContrastRoute &&
      !this.isSettingsRoute &&
      !this.isWelcomeRoute
    );
  }

  get theme(): themes {
    const userTheme = this.settings.get('userTheme');
    const OSTheme = this.settings.get('osTheme');

    if (userTheme && userTheme !== 'dynamic') {
      return userTheme;
    }

    return OSTheme || 'light';
  }

  constructor() {
    super(...arguments);

    if (typeof requireNode !== 'undefined') {
      const { ipcRenderer } = requireNode('electron');

      this.ipcRenderer = ipcRenderer;

      this.ipcRenderer.on(
        'changeColor',
        async (_event: unknown, color: string) => {
          const addedColor = await this.addColor(color);

          if (addedColor) {
            this.colorUtils.copyColorToClipboard(addedColor);
          }
        },
      );

      this.ipcRenderer.on('openContrastChecker', () => {
        this.router.transitionTo('contrast');
      });

      this.ipcRenderer.on(
        'openSharedPalette',
        async (_event: unknown, query: string) => {
          const data = JSON.parse(decodeURIComponent(query));
          const colors = data?.colors ?? [];
          const name = data?.name ?? 'Palette';

          await this.createPalette(name, colors);
        },
      );

      this.ipcRenderer.on('setTheme', (_event: unknown, theme: string) => {
        this.settings.set('osTheme', theme);
      });

      // We have to initially set this, in case somehow the checkbox gets out of sync
      const shouldEnableAutoStart = this.settings.get('openOnStartup');

      this.ipcRenderer.send('enableDisableAutoStart', shouldEnableAutoStart);

      this.ipcRenderer
        .invoke('getStoreValue', 'showDockIcon')
        .then((showDockIcon: boolean) => {
          this.settings.set('showDockIcon', showDockIcon);
        });

      this.ipcRenderer
        .invoke('getShouldUseDarkColors')
        .then((theme: string) => {
          this.settings.set('osTheme', theme);
        });
    }
  }

  willDestroy(): void {
    super.willDestroy();

    if (this.ipcRenderer) {
      this.ipcRenderer.removeAllListeners('changeColor');
      this.ipcRenderer.removeAllListeners('openContrastChecker');
      this.ipcRenderer.removeAllListeners('setTheme');
    }
  }

  @action
  async addColor(color: string): Promise<ColorModel | undefined> {
    const { colorHistory } = this.data;

    if (colorHistory) {
      const colorPOJO = this.colorUtils.createColorPOJO(
        color,
        this.dataSchema.generateId('color'),
      );

      delete colorPOJO.attributes.hex;

      const [colorModel] = await this.store.update<[ColorModel]>((t) => [
        t.addRecord(colorPOJO),
        t.addToRelatedRecords(colorHistory, 'colors', {
          type: 'color',
          id: String(colorPOJO.id),
        }),
      ]);

      this.undoManager.setupUndoRedo();

      return colorModel;
    }
  }

  @action
  checkForUpdates(): void {
    this.ipcRenderer.send('checkForUpdates');
  }

  @action
  async createPalette(
    paletteName: string,
    colors: { name: string; hex: string }[],
  ): Promise<void> {
    this.router.transitionTo('palettes');

    const colorPOJOs = colors.map((c) => {
      const colorPOJO = this.colorUtils.createColorPOJO(
        c.hex,
        this.dataSchema.generateId('color'),
      );

      delete colorPOJO.attributes.hex;

      return colorPOJO;
    });
    const colorsList = colorPOJOs.map((c) => ({ type: c.type, id: c.id }));

    await this.store.update((t) => [
      ...colorPOJOs.map((c) => t.addRecord(c)),
      t.addRecord({
        type: 'palette',
        id: this.dataSchema.generateId('palette'),
        name: paletteName,
        colorOrder: colorsList,
        colors: colorsList,
        createdAt: new Date(),
        index: 0,
        isColorHistory: false,
        isFavorite: false,
        isLocked: false,
      }),
    ]);

    this.undoManager.setupUndoRedo();
  }

  @action
  enableDisableAutoStart(e: InputEvent): void {
    this.ipcRenderer.send(
      'enableDisableAutoStart',
      (<HTMLInputElement>e.target).checked,
    );
  }

  @action
  exitApp(): void {
    this.ipcRenderer.send('exitApp');
  }

  @action
  launchPicker(): void {
    this.ipcRenderer.send('launchPicker');
  }

  @action
  toggleColorPickerIsShown(color?: ColorModel): void {
    if (color?.hex) {
      this.colorPickerColor = color;
    }

    this.colorPickerIsShown = !this.colorPickerIsShown;
  }

  @action
  toggleShowDockIcon(e: InputEvent): void {
    const showDockIcon = (<HTMLInputElement>e.target).checked;

    this.settings.set('showDockIcon', showDockIcon);
    this.ipcRenderer.send('setShowDockIcon', showDockIcon);
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your controllers.
declare module '@ember/controller' {
  interface Registry {
    application: ApplicationController;
  }
}

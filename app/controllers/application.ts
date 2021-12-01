import { A } from '@ember/array';
import Controller from '@ember/controller';
import { action } from '@ember/object';
import Router from '@ember/routing/router-service';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

import FlashMessageService from 'ember-cli-flash/services/flash-messages';
import { storageFor } from 'ember-local-storage';
import { Store } from 'ember-orbit';

import { RecordSchema } from '@orbit/records';
import { IpcRenderer } from 'electron';

import ColorModel from 'swach/data-models/color';
import PaletteModel from 'swach/data-models/palette';
import ColorUtils from 'swach/services/color-utils';
import UndoManager from 'swach/services/undo-manager';
import { SettingsStorage, themes } from 'swach/storages/settings';

export default class ApplicationController extends Controller {
  @service colorUtils!: ColorUtils;
  @service dataSchema!: RecordSchema;
  @service flashMessages!: FlashMessageService;
  @service router!: Router;
  @service store!: Store;
  @service undoManager!: UndoManager;

  ipcRenderer!: IpcRenderer;

  @tracked colorPickerColor?: ColorModel;
  @tracked colorPickerIsShown = false;

  @storageFor('settings') settings!: SettingsStorage;

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
      !this.isContrastRoute && !this.isSettingsRoute && !this.isWelcomeRoute
    );
  }

  get showEyedropperIcon(): boolean {
    return (
      !this.isContrastRoute && !this.isSettingsRoute && !this.isWelcomeRoute
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
        }
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
        }
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
    const palettes = await this.store.findRecords<PaletteModel[]>('palette');
    const colorHistory = A(palettes).findBy('isColorHistory', true);

    if (colorHistory) {
      const colorPOJO = this.colorUtils.createColorPOJO(color);
      colorPOJO.id = this.dataSchema.generateId('color');

      if (colorPOJO?.id) {
        const [colorModel] = await this.store.update<[ColorModel]>((t) => {
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

        return colorModel;
      }
    }
  }

  @action
  checkForUpdates(): void {
    this.ipcRenderer.send('checkForUpdates');
  }

  @action
  async createPalette(
    paletteName: string,
    colors: { name: string; hex: string }[]
  ): Promise<void> {
    this.router.transitionTo('palettes');

    const colorPOJOs = colors.map((c) =>
      this.colorUtils.createColorPOJO(
        c.hex,
        this.dataSchema.generateId('color')
      )
    );
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
        isLocked: false
      })
    ]);

    this.undoManager.setupUndoRedo();
  }

  @action
  enableDisableAutoStart(e: InputEvent): void {
    this.ipcRenderer.send(
      'enableDisableAutoStart',
      (<HTMLInputElement>e.target).checked
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

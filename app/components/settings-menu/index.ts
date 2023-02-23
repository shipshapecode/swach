import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import { storageFor } from 'ember-local-storage';

import type { IpcRenderer } from 'electron';

import { SettingsStorage, themes } from 'swach/storages/settings';
interface SettingsMenuSignature {
  Element: HTMLDivElement;
  Args: {
    checkForUpdates: () => void;
    enableDisableAutoStart: (e: InputEvent) => void;
    toggleShowDockIcon: (e: InputEvent) => void;
  };
}

export default class SettingsMenu extends Component<SettingsMenuSignature> {
  @storageFor('settings') settings!: SettingsStorage;

  declare ipcRenderer: IpcRenderer;
  themes = ['light', 'dark', 'dynamic'];

  @tracked platform?: string;

  constructor(owner: unknown, args: SettingsMenuSignature['Args']) {
    super(owner, args);

    if (typeof requireNode !== 'undefined') {
      const { ipcRenderer } = requireNode('electron');
      this.ipcRenderer = ipcRenderer;

      this.ipcRenderer.invoke('getPlatform').then((platform: string) => {
        this.platform = platform;
      });
    }
  }

  get isMacOS(): boolean {
    return this.platform === 'darwin';
  }

  get isMacOSOrWindows(): boolean {
    return this.platform === 'darwin' || this.platform === 'win32';
  }

  @action
  changeTheme(theme: themes): void {
    this.settings.set('userTheme', theme);
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    SettingsMenu: typeof SettingsMenu;
  }
}

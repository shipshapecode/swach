import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { storageFor } from 'ember-local-storage';
import { SettingsStorage, themes } from 'swach/storages/settings';

interface SettingsMenuArgs {
  checkForUpdates: () => void;
  enableDisableAutoStart: (e: InputEvent) => void;
  toggleShowDockIcon: (e: InputEvent) => void;
}

export default class SettingsMenu extends Component<SettingsMenuArgs> {
  @storageFor('settings') settings!: SettingsStorage;

  ipcRenderer: any;
  themes = ['dynamic', 'light', 'dark'];

  @tracked platform?: string;

  constructor(owner: unknown, args: SettingsMenuArgs) {
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

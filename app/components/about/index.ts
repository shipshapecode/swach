import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import { IpcRenderer } from 'electron';

export default class SettingsMenu extends Component {
  ipcRenderer!: IpcRenderer;

  copyrightYear = new Date().getFullYear();
  @tracked version = 'Version not available';

  constructor(owner: unknown, args: Record<string, unknown>) {
    super(owner, args);

    if (typeof requireNode !== 'undefined') {
      const { ipcRenderer } = requireNode('electron');
      this.ipcRenderer = ipcRenderer;

      this.ipcRenderer.invoke('getAppVersion').then((version: string) => {
        this.version = version;
      });
    }
  }

  @action
  visitWebsite(event: Event): void {
    event.preventDefault();

    if (typeof requireNode !== 'undefined') {
      requireNode('electron').shell.openExternal('https://swach.io/');
    }
  }
}

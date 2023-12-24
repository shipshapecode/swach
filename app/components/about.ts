import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

import type { IpcRenderer } from 'electron';

interface AboutSignature {
  Element: HTMLDivElement;
}

export default class AboutComponent extends Component<AboutSignature> {
  declare ipcRenderer: IpcRenderer;

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

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    About: typeof AboutComponent;
  }
}

import { action } from '@ember/object';
import type Owner from '@ember/owner';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import type { IpcRenderer } from 'electron';
import { on } from "@ember/modifier";

interface AboutSignature {
  Element: HTMLDivElement;
}

export default class AboutComponent extends Component<AboutSignature> {<template><div class="text-xs">
  <h6 class="font-semibold mt-4 text-heading text-sm">
    About
  </h6>

  <p class="mt-2">
    Version:
    {{this.version}}
  </p>

  <p>
    Copyright ©
    {{this.copyrightYear}}
    Ship Shape Consulting LLC.
  </p>

  <p>
    All rights reserved.
  </p>

  <p>
    <a href class="hover:text-alt-hover" {{on "click" this.visitWebsite}}>
      https://swach.io/
    </a>
  </p>
</div></template>
  declare ipcRenderer: IpcRenderer;

  copyrightYear = new Date().getFullYear();
  @tracked version = 'Version not available';

  constructor(owner: Owner, args: Record<string, unknown>) {
    super(owner, args);

    if (typeof requireNode !== 'undefined') {
      const { ipcRenderer } = requireNode('electron');

      this.ipcRenderer = ipcRenderer;

      void this.ipcRenderer.invoke('getAppVersion').then((version: string) => {
        this.version = version;
      });
    }
  }

  @action
  visitWebsite(event: Event): void {
    event.preventDefault();

    if (typeof requireNode !== 'undefined') {
      void this.ipcRenderer.invoke('open-external', 'https://swach.io/');
    }
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    About: typeof AboutComponent;
  }
}

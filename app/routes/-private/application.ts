import Route from '@ember/routing/route';
import Router from '@ember/routing/router-service';
import { service } from '@ember/service';

import Session from 'ember-simple-auth/services/session';

import { IpcRenderer } from 'electron';

import Data from 'swach/services/data';

export default class ApplicationRoute extends Route {
  @service data!: Data;
  @service router!: Router;
  @service session!: Session;

  ipcRenderer!: IpcRenderer;

  constructor() {
    super(...arguments);

    if (typeof requireNode !== 'undefined') {
      const { ipcRenderer } = requireNode('electron');
      this.ipcRenderer = ipcRenderer;

      this.router.on('routeDidChange', () => {
        this.ipcRenderer.send('setTouchbar', []);
      });
    }
  }

  async beforeModel(): Promise<void> {
    await this.data.activate();
    await this.data.synchronize();

    this.session.on('authenticationSucceeded', () => this.data.synchronize());
    this.session.on('invalidationSucceeded', () => this.data.reset());
  }
}

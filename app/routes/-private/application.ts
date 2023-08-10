import Route from '@ember/routing/route';
import type Router from '@ember/routing/router-service';
import { service } from '@ember/service';

import Session from 'ember-simple-auth/services/session';

import type { IpcRenderer } from 'electron';

import type DataService from 'swach/services/data';

export default class ApplicationRoute extends Route {
  @service declare data: DataService;
  @service declare router: Router;
  @service declare session: Session;

  declare ipcRenderer: IpcRenderer;

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
    await this.session.setup();

    await this.data.activate();
    await this.data.synchronize();
  }
}

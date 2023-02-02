import Controller, { inject as controller } from '@ember/controller';
import { action } from '@ember/object';
import { service } from '@ember/service';

import type Session from 'ember-simple-auth/services/session';

import type ApplicationController from 'swach/controllers/application';

export default class SettingsController extends Controller {
  @controller application!: ApplicationController;
  @service declare session: Session;

  @action
  goBack(): void {
    window.history.back();
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your controllers.
declare module '@ember/controller' {
  interface Registry {
    settings: SettingsController;
  }
}

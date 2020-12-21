import Controller, { inject as controller } from '@ember/controller';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import ApplicationController from 'swach/controllers/application';
import Session from 'ember-simple-auth/services/session';

export default class SettingsController extends Controller {
  @controller application!: ApplicationController;
  @service session!: Session;

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

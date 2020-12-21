import Controller from '@ember/controller';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import Router from '@ember/routing/router-service';
import Session from 'ember-simple-auth/services/session';

export default class SettingsAccountController extends Controller {
  @service router!: Router;
  @service session!: Session;

  @action
  logOut(): void {
    this.session.invalidate();
    this.router.transitionTo('settings.cloud.login');
  }
}

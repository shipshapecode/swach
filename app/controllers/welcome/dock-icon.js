import Controller, { inject as controller } from '@ember/controller';
import { storageFor } from 'ember-local-storage';

export default class WelcomeDockIconController extends Controller {
  @controller application;

  @storageFor('settings') settings;
}

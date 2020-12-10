import EmberRouter from '@ember/routing/router';
import config from 'swach/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('colors');
  this.route('contrast');
  this.route('kuler');
  this.route('login');
  this.route('palettes');
  // this.route('register', function () {
  //   this.route('confirm');
  //   this.route('resend');
  // });
  this.route('settings');
  this.route('welcome', function () {
    this.route('auto-start');
    this.route('dock-icon');
  });
});

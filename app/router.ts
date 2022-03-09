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
  this.route('palettes');
  this.route('settings', function () {
    this.route('cloud', function () {
      this.route('forgot-password');
      this.route('login');
      this.route('profile');
      this.route('register', function () {
        this.route('confirm');
        this.route('resend');
      });
    });
    this.route('general');
    this.route('data');
  });
  this.route('welcome', function () {
    this.route('auto-start');
    this.route('cloud-sync');
    this.route('dock-icon');
  });
});

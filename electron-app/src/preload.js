const { app } = require('electron');
const Sentry = require('@sentry/electron');

Sentry.init({
  dsn: 'https://6974b46329f24dc1b9fca4507c65e942@sentry.io/3956140',
  release: `v${app.getVersion()}`
});

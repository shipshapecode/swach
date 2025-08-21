import { init } from '@sentry/electron';
import pkg from '../../package.json';

init({
  appName: 'swach',
  dsn: 'https://6974b46329f24dc1b9fca4507c65e942@sentry.io/3956140',
  release: `v${pkg.version}`,
});

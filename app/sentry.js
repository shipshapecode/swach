import * as Sentry from '@sentry/browser';
import { Ember } from '@sentry/integrations/esm/ember';
import { CaptureConsole } from '@sentry/integrations/esm/captureconsole';

import config from './config/environment';

export function startSentry() {
  Sentry.init({
    ...config.sentry,
    dsn:
      'https://7c2313d0bc4c444192387c0e6a3c6de9@o361681.ingest.sentry.io/5430079',
    integrations: [
      new Ember(),
      new CaptureConsole({
        levels: ['error']
      })
    ],
    beforeSend(event, hint) {
      let error = hint.originalException;

      // ignore aborted route transitions from the Ember.js router
      if (error && error.name === 'TransitionAborted') {
        return null;
      }

      return event;
    }
  });
}

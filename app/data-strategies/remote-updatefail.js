import { RequestStrategy } from '@orbit/coordinator';
import { NetworkError } from '@orbit/jsonapi';

export default {
  create() {
    return new RequestStrategy({
      name: 'remote-updatefail',
      source: 'remote',
      on: 'updateFail',
      action(transform, e) {
        // Retry network / fetch failures
        if (e instanceof NetworkError || e.message === 'Failed to fetch') {
          // TODO: Consider an incremental backoff rather than a fixed delay.
          setTimeout(() => {
            this.source.requestQueue.retry();
          }, 5000);
        } else {
          // TODO: Consider logging additional errors with sentry or equivalent.
        }
      },
    });
  },
};

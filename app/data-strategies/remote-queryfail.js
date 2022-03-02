import { RequestStrategy } from '@orbit/coordinator';

export default {
  create() {
    return new RequestStrategy({
      name: 'remote-queryfail',
      source: 'remote',
      on: 'queryFail',
      action() {
        // Skip failed remote queries since there's no need to retain them in
        // the queue for later retries (unlike updates).
        // TODO: Consider logging errors in sentry or equivalent.
        this.source.requestQueue.skip();
      }
    });
  }
};

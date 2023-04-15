import { getOwner } from '@ember/application';

import { SyncStrategy } from '@orbit/coordinator';

export default {
  create(injections = {}) {
    const app = getOwner(injections);
    const session = app.lookup('service:session');

    return new SyncStrategy({
      name: 'remote-store-sync',

      /**
       * The name of the source which will have its `transform` event observed.
       */
      source: 'remote',

      /**
       * The name of the source which will be acted upon.
       *
       * When the source receives the `transform` event, the `sync` method
       * will be invoked on the target.
       */
      target: 'store',

      /**
       * A handler for any errors thrown as a result of invoking `sync` on the
       * target.
       */
      // catch(e) {},

      /**
       * A filter function that returns `true` if `sync` should be performed.
       *
       * `filter` will be invoked in the context of this strategy (and thus will
       * have access to both `this.source` and `this.target`).
       */
      filter() {
        // only sync remote if authenticated
        return session.isAuthenticated;
      },

      /**
       * Ensure that remote transforms are sync'd with the store before
       * remote requests resolve.
       */
      blocking: true,
    });
  },
};

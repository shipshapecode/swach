import { getOwner } from '@ember/application';

import { RequestStrategy } from '@orbit/coordinator';

export default {
  create(injections = {}) {
    const app = getOwner(injections);
    const session = app.lookup('service:session');

    return new RequestStrategy({
      name: 'store-beforequery-remote-query',

      /**
       * The name of the source to be observed.
       */
      source: 'store',

      /**
       * The name of the event to observe (e.g. `beforeQuery`, `query`,
       * `beforeUpdate`, `update`, etc.).
       */
      on: 'beforeQuery',

      /**
       * The name of the source which will be acted upon.
       */
      target: 'remote',

      /**
       * The action to perform on the target.
       *
       * Can be specified as a string (e.g. `pull`) or a function which will be
       * invoked in the context of this strategy (and thus will have access to
       * both `this.source` and `this.target`).
       */
      action: 'query',

      /**
       * A handler for any errors thrown as a result of performing the action.
       */
      // catch(e) {},

      /**
       * A filter function that returns `true` if the `action` should be performed.
       *
       * `filter` will be invoked in the context of this strategy (and thus will
       * have access to both `this.source` and `this.target`).
       */
      filter() {
        // only query remote if authenticated
        return session.isAuthenticated;
      },

      catch(e, transform) {
        // eslint-disable-next-line no-console
        console.log('Error performing remote.update()', transform, e);
        this.source.requestQueue.skip(e);
        this.target.requestQueue.skip(e);
        throw e;
      },

      /**
       * Should results returned from calling `action` on the `target` source be
       * passed as hint data back to the `source`?
       *
       * This can allow hints to inform the processing of subsequent actions on the
       * source. For instance, a `beforeQuery` event might invoke `query` on a
       * target, and those results could inform how the originating source performs
       * `_query`. This might allow a target source's sorting and filtering of
       * results to affect how the originating source processes the query.
       *
       * This setting is only effective for `blocking` strategies, since only in
       * those scenarios is processing delayed.
       */
      passHints: false,

      /**
       * Don't block fulfillment of requests to the store with associated remote
       * requests. Allows for optimistic UX.
       */
      blocking: false,
    });
  },
};

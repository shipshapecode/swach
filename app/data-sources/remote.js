import { getOwner } from '@ember/application';
import { isPresent } from '@ember/utils';

import RemoteSource, { JSONAPIRequestProcessor } from '@orbit/jsonapi';

export default {
  create(injections = {}) {
    class RemoteRequestProcessor extends JSONAPIRequestProcessor {
      initFetchSettings(customSettings = {}) {
        let settings = super.initFetchSettings(customSettings);

        const app = getOwner(injections);
        const session = app.lookup('service:session');

        if (session.isAuthenticated) {
          let { access_token } = session.data.authenticated;
          if (isPresent(access_token)) {
            settings.headers['Authorization'] = `Bearer ${access_token}`;
          }
        }

        settings.headers['Content-Type'] = 'application/vnd.api+json';
        delete settings.headers['Accept'];

        return settings;
      }
    }
    injections.name = 'remote';
    injections.host =
      'https://jpuj8ukmx8.execute-api.us-east-2.amazonaws.com/dev';
    injections.RequestProcessorClass = RemoteRequestProcessor;

    return new RemoteSource(injections);
  }
};

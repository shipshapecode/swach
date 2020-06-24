import RemoteSource, { JSONAPIRequestProcessor } from '@orbit/jsonapi';
import { getOwner } from '@ember/application';
import { isPresent } from '@ember/utils';

export default {
  create(injections = {}) {
    class RemoteRequestProcessor extends JSONAPIRequestProcessor {
      initFetchSettings(customSettings = {}) {
        let settings = super.initFetchSettings(customSettings);

        // TODO: add ember-simple-auth and get a session service going
        // const app = getOwner(injections);
        // const session = app.lookup('service:session');
        //
        // if (session.isAuthenticated) {
        //   let { access_token } = session.data.authenticated;
        //   if (isPresent(access_token)) {
        //     settings.headers['Authorization'] = `Bearer ${access_token}`;
        //   }
        // }

        settings.headers['Content-Type'] = 'application/vnd.api+json';
        delete settings.headers['Accept'];

        return settings;
      }
    }
    injections.name = 'remote';
    injections.host = 'https://lined-old-asiandamselfly.gigalixirapp.com';
    injections.namespace = 'api';
    injections.RequestProcessorClass = RemoteRequestProcessor;

    return new RemoteSource(injections);
  }
};

import { getOwner } from '@ember/application';
import { isPresent } from '@ember/utils';

import RemoteSource, { JSONAPIRequestProcessor } from '@orbit/jsonapi';
import { AwsClient } from 'aws4fetch';

export default {
  create(injections = {}) {
    class RemoteRequestProcessor extends JSONAPIRequestProcessor {
      initFetchSettings(customSettings = {}) {
        let settings = super.initFetchSettings(customSettings);

        const app = getOwner(injections);
        const session = app.lookup('service:session');

        if (session.isAuthenticated) {
          let { sessionCredentials } = session.data.authenticated;
          if (isPresent(sessionCredentials)) {
            settings.sessionCredentials = sessionCredentials;
          }
        }

        return settings;
      }
      async fetch(url, customSettings) {
        let settings = this.initFetchSettings(customSettings);
        const aws = new AwsClient({
          accessKeyId: settings.sessionCredentials.accessKeyId, // required, akin to AWS_ACCESS_KEY_ID
          secretAccessKey: settings.sessionCredentials.secretAccessKey, // required, akin to AWS_SECRET_ACCESS_KEY
          sessionToken: settings.sessionCredentials.sessionToken, // akin to AWS_SESSION_TOKEN if using temp credentials
          service: 'execute-api', // AWS service, by default parsed at fetch time
          region: 'us-east-2' // AWS region, by default parsed at fetch time
        });
        const method = settings.body ? 'POST' : 'GET';
        const request = await aws.sign(url, { method });

        let fullUrl = url;
        if (settings.params) {
          fullUrl = this.urlBuilder.appendQueryParams(fullUrl, settings.params);
          delete settings.params;
        }

        let fetchFn = fetch;

        console.log('fetch', fullUrl, request, 'polyfill', fetchFn.polyfill);

        if (settings.timeout !== undefined && settings.timeout > 0) {
          let timeout = settings.timeout;
          delete settings.timeout;

          return new Promise((resolve, reject) => {
            let timedOut;

            let timer = setTimeout(() => {
              timedOut = true;
              reject(new Error(`No fetch response within ${timeout}ms.`));
            }, timeout);

            fetchFn(request)
              .catch((e) => {
                clearTimeout(timer);

                if (!timedOut) {
                  return this.handleFetchError(e);
                }
              })
              .then((response) => {
                clearTimeout(timer);

                if (!timedOut) {
                  return this.handleFetchResponse(response);
                }
              })
              .then(resolve, reject);
          });
        } else {
          return fetchFn(fullUrl, settings)
            .catch((e) => this.handleFetchError(e))
            .then((response) => this.handleFetchResponse(response));
        }
      }
    }

    injections.name = 'remote';
    injections.host =
      'https://jpuj8ukmx8.execute-api.us-east-2.amazonaws.com/dev';
    injections.RequestProcessorClass = RemoteRequestProcessor;

    return new RemoteSource(injections);
  }
};

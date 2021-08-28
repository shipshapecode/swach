import { getOwner } from '@ember/application';
import { isPresent } from '@ember/utils';

import { pluralize, singularize } from 'ember-inflector';

import {
  JSONAPIRequestProcessor,
  JSONAPISerializers,
  JSONAPISource
} from '@orbit/jsonapi';
import { buildSerializerSettingsFor } from '@orbit/serializers';
import { AwsClient } from 'aws4fetch';

import ENV from 'swach/config/environment';

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
        let fullUrl = url;
        if (settings.params) {
          fullUrl = this.urlBuilder.appendQueryParams(fullUrl, settings.params);
          delete settings.params;
        }
        const aws = new AwsClient({
          accessKeyId: settings.sessionCredentials.accessKeyId, // required, akin to AWS_ACCESS_KEY_ID
          secretAccessKey: settings.sessionCredentials.secretAccessKey, // required, akin to AWS_SECRET_ACCESS_KEY
          sessionToken: settings.sessionCredentials.sessionToken, // akin to AWS_SESSION_TOKEN if using temp credentials
          service: 'execute-api', // AWS service, by default parsed at fetch time
          region: 'us-east-2' // AWS region, by default parsed at fetch time
        });
        const method = customSettings.method ?? 'GET';
        const request = await aws.sign(fullUrl, {
          method,
          body: settings.body
        });

        let fetchFn = fetch;

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
          return fetchFn(request)
            .catch((e) => this.handleFetchError(e))
            .then((response) => this.handleFetchResponse(response));
        }
      }
    }

    injections.name = 'remote';
    injections.host = ENV.api.host;
    injections.RequestProcessorClass = RemoteRequestProcessor;

    injections.serializerSettingsFor = buildSerializerSettingsFor({
      sharedSettings: {
        inflectors: {
          pluralize,
          singularize
        }
      },
      settingsByType: {
        [JSONAPISerializers.ResourceType]: {
          deserializationOptions: { inflectors: ['singularize'] }
        },
        [JSONAPISerializers.ResourceDocument]: {
          deserializationOptions: { inflectors: ['singularize'] }
        }
      }
    });

    return new JSONAPISource(injections);
  }
};

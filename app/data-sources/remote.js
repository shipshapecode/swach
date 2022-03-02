import { getOwner } from '@ember/application';

import { pluralize, singularize } from 'ember-inflector';
import { applyStandardSourceInjections } from 'ember-orbit';

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
    applyStandardSourceInjections(injections);

    const app = getOwner(injections);
    const session = app.lookup('service:session');

    class RemoteRequestProcessor extends JSONAPIRequestProcessor {
      initFetchSettings(customSettings = {}) {
        if (!session.isAuthenticated) {
          throw new Error('Remote requests require authentication');
        }

        const settings = super.initFetchSettings(customSettings);
        settings.sessionCredentials =
          session.data.authenticated.sessionCredentials;

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

    // Delay activation until coordinator has been activated. This prevents
    // queues from being processed before coordination strategies have been
    // configured.
    injections.autoActivate = false;

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

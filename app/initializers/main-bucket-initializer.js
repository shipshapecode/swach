import BucketFactory from '../data-buckets/main';

export function initialize(application) {
  const config = application.resolveRegistration('ember-orbit:config') || {};

  const bucketService = 'main-bucket';

  // Register bucket service
  application.register(`service:${bucketService}`, BucketFactory);

  // Inject bucket into all sources
  if (config.types) {
    application.inject(
      config.types.source,
      'bucket',
      `service:${bucketService}`
    );
  }

  // Inject bucket into keyMap (if one is present)
  if (config.services && !config.skipKeyMap) {
    application.inject(
      `service:${config.services.keyMap}`,
      'bucket',
      `service:${bucketService}`
    );
  }
}

export default {
  name: 'main-bucket-initializer',
  after: 'ember-orbit-config',
  initialize
};

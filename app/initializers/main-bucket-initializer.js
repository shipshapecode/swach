import BucketFactory from '../data-buckets/main';

export function initialize(application) {
  const orbitConfig = application.resolveRegistration('ember-orbit:config');

  application.register(`service:${orbitConfig.services.bucket}`, BucketFactory);
}

export default {
  name: 'main-bucket-initializer',
  after: 'ember-orbit-config',
  initialize,
};

import BucketClass from '@orbit/indexeddb-bucket';

export default {
  create(injections = {}) {
    injections.name = 'main';
    injections.namespace = 'swach-main';

    return new BucketClass(injections);
  },
};

import SourceClass from '@orbit/indexeddb';

export default {
  create(injections = {}) {
    injections.name = 'backup';
    return new SourceClass(injections);
  }
};

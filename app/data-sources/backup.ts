import SourceClass from '@orbit/indexeddb';

export default {
  create(injections: { name?: string } = {}) {
    injections.name = 'backup';
    return new SourceClass(injections);
  }
};

import SourceClass from '@orbit/indexeddb';

export default {
  create(injections: { name?: string } = {}): SourceClass {
    injections.name = 'backup';
    return new SourceClass(injections);
  }
};

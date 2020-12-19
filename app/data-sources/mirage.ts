import SourceClass from '@orbit/jsonapi';

export default {
  create(injections: { name?: string } = {}): SourceClass {
    injections.name = 'mirage';
    return new SourceClass(injections);
  }
};

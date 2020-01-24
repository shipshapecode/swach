import SourceClass from '@orbit/jsonapi';

export default {
  create(injections = {}) {
    injections.name = 'mirage';
    return new SourceClass(injections);
  }
};

import Service from '@ember/service';

declare module 'ember-context-menu/services/context-menu' {
  export default class ContextMenuService extends Service {
    activate(event, items, selection, details): void;
  }
}
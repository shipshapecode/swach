import Service from '@ember/service';
import EventedMixin from '@ember/object/evented'

declare module 'ember-drag-sort/services/drag-sort' {
  export default class DragSortService extends Service.extend(EventedMixin) {
  }
}
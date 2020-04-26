import EmberLoadRemover from 'ember-load/components/ember-load-remover';
import { later } from '@ember/runloop';

export default class EmberLoadRemoverComponent extends EmberLoadRemover {
  removeLoadingIndicator() {
    later(() => {
      super.removeLoadingIndicator(...arguments);
    }, 1000);
  }
}

import DragSortList from 'ember-drag-sort/components/drag-sort-list';
import { action } from '@ember/object';
import { fadeOut } from 'ember-animated/motions/opacity';
import move from 'ember-animated/motions/move';

export default class AnimatedDragSortList extends DragSortList {
  didDrag = false;

  dragEnter() {
    this.set('didDrag', true);
    // eslint-disable-next-line ember/no-ember-super-in-es-classes
    this._super(...arguments);
  }

  @action
  rules() {
    if (!this.didDrag) {
      return this.transition;
    }

    this.set('didDrag', false);

    return null;
  }

  *transition({ keptSprites, insertedSprites, removedSprites }) {
    for (let sprite of insertedSprites) {
      sprite.startTranslatedBy(0, -sprite.finalBounds.height / 2);
      move(sprite);
    }

    for (let sprite of keptSprites) {
      move(sprite);
    }

    for (let sprite of removedSprites) {
      fadeOut(sprite);
    }
  }
}

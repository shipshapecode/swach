import { action, set } from '@ember/object';

import { easeOut } from 'ember-animated/easings/cosine';
import move from 'ember-animated/motions/move';
import { fadeOut } from 'ember-animated/motions/opacity';
import classic from 'ember-classic-decorator';
import DragSortList from 'ember-drag-sort/components/drag-sort-list';

@classic
export default class AnimatedDragSortList extends DragSortList {
  didDrag = false;

  dragEnter(): void {
    set(this, 'didDrag', true);
    super.dragEnter(...arguments);
  }

  @action
  rules() {
    if (!this.didDrag) {
      return this.transition;
    }

    set(this, 'didDrag', false);

    return null;
  }

  *transition({
    keptSprites,
    insertedSprites,
    removedSprites
  }: {
    keptSprites: any;
    insertedSprites: any;
    removedSprites: any;
  }) {
    for (const sprite of insertedSprites) {
      sprite.startTranslatedBy(0, -sprite.finalBounds.height / 2);
      move(sprite, { easing: easeOut });
    }

    for (const sprite of keptSprites) {
      move(sprite, { easing: easeOut });
    }

    for (const sprite of removedSprites) {
      fadeOut(sprite, { easing: easeOut });
    }
  }
}

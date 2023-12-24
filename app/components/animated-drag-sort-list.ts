import { action, set } from '@ember/object';

import { easeOut } from 'ember-animated/easings/cosine';
import move from 'ember-animated/motions/move';
import { fadeOut } from 'ember-animated/motions/opacity';
import DragSortList from 'ember-drag-sort/components/drag-sort-list';

import type Sprite from 'ember-animated/-private/sprite';

export default class AnimatedDragSortList extends DragSortList {
  didDrag = false;

  dragEnter(event: Event): void {
    set(this, 'didDrag', true);
    super.dragEnter(event);
  }

  @action
  rules(): unknown {
    if (!this.didDrag) {
      return this.transition;
    }

    set(this, 'didDrag', false);

    return null;
  }

  *transition({
    keptSprites,
    insertedSprites,
    removedSprites,
  }: {
    keptSprites: Array<Sprite>;
    insertedSprites: Array<Sprite>;
    removedSprites: Array<Sprite>;
  }): unknown {
    for (const sprite of insertedSprites) {
      if (sprite.finalBounds?.height) {
        sprite.startTranslatedBy(0, -sprite.finalBounds.height / 2);
      }

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

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    AnimatedDragSortList: typeof AnimatedDragSortList;
  }
}

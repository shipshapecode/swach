import Component from '@glimmer/component';
import { action } from '@ember/object';
import { fadeOut } from 'ember-animated/motions/opacity';
import move from 'ember-animated/motions/move';
import { easeOut } from 'ember-animated/easings/cosine';

export default class ColorsList extends Component {
  get sortedColors() {
    return this.args.palette.colors.sortBy('createdAt').reverse();
  }

  *transition({ keptSprites, insertedSprites, removedSprites }) {
    for (let sprite of insertedSprites) {
      sprite.startTranslatedBy(0, -sprite.finalBounds.height / 2);
      move(sprite, { easing: easeOut });
    }

    for (let sprite of keptSprites) {
      move(sprite, { easing: easeOut });
    }

    for (let sprite of removedSprites) {
      fadeOut(sprite, { easing: easeOut });
    }
  }

  @action
  deleteColor(color) {
    if (!this.args.palette.isLocked) {
      this.args.palette.colors.removeObject(color);
      this.args.palette.save();
    }
  }
}

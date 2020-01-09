import Component from '@glimmer/component';
import { action } from '@ember/object';
import { fadeOut } from 'ember-animated/motions/opacity';
import move from 'ember-animated/motions/move';

export default class ColorsList extends Component {
  get sortedColors() {
    return this.args.palette.colors.sortBy('createdAt').reverse();
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

  @action
  deleteColor(color) {
    if (!this.args.palette.isLocked) {
      this.args.palette.colors.removeObject(color);
      this.args.palette.save();
    }
  }
}

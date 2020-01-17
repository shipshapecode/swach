import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { fadeOut } from 'ember-animated/motions/opacity';
import move from 'ember-animated/motions/move';

export default class ColorsList extends Component {
  @service undoManager;

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
  async deleteColor(color) {
    const { palette } = this.args;
    if (!palette.isLocked) {
      palette.colors.removeObject(color);
      await palette.save();

      this.undoManager.add({
        async undo() {
          palette.colors.addObject(color);
          await palette.save();
        },
        async redo() {
          palette.colors.removeObject(color);
          await palette.save();
        }
      });
    }
  }
}

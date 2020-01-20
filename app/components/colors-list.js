import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { fadeOut } from 'ember-animated/motions/opacity';
import move from 'ember-animated/motions/move';
import { easeOut } from 'ember-animated/easings/cosine';

export default class ColorsList extends Component {
  @service store;
  @service undoManager;

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
  async deleteColor(color) {
    const { store } = this;
    const { palette } = this.args;
    if (!palette.isLocked) {
      const redo = async () => {
        palette.colors.removeObject(color);
        await palette.save();
        await color.save();

        if (!color.palettes.length) {
          await color.destroyRecord();
        }
      };

      redo();

      this.undoManager.add({
        async undo() {
          if (color.isDestroyed) {
            store.createRecord(color);
          }
          palette.colors.addObject(color);
          await palette.save();
          await color.save();
        },
        redo
      });
    }
  }
}

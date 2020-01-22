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
    const { palette } = this.args;
    if (!palette.isLocked) {
      await palette.colors.removeObject(color);

      const transformId = this.store.transformLog.head;
      const redoTransform = this.store.getTransform(transformId).operations;
      const undoTransform = this.store.getInverseOperations(transformId);
  
      const undo = async () => {
        await this.store.update(undoTransform);
      };
  
      const redo = async () => {
        await this.store.update(redoTransform);
      };
  
      this.undoManager.add({ undo, redo });

      // TODO: figure out how to add this back and be able to undo/redo
      // if (!color.palettes.length) {
      //   await color.remove();
      // }
    }
  }
}

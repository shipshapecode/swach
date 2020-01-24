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
      const colorsList = palette.colors.map(color => {
        return { type: 'color', id: color.id };
      });

      const colorToRemove = colorsList.findBy('id', color.id);
      colorsList.removeObject(colorToRemove);

      await this.store.update(t => {
        const operations = [
          t.replaceRelatedRecords(
            { type: 'palette', id: palette.id },
            'colors',
            colorsList
          )
        ];

        // If the color only exists in in color history, and we remove it, we should delete the color
        if (
          color.palettes.length === 1 &&
          color.palettes.firstObject.isColorHistory
        ) {
          operations.push(t.removeRecord({ type: 'color', id: color.id }));
        }

        return operations;
      });

      this.undoManager.setupUndoRedo();
    }
  }
}

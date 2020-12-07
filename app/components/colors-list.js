/* eslint-disable ember/no-computed-properties-in-native-classes */
import Component from '@glimmer/component';
import { action, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { fadeOut } from 'ember-animated/motions/opacity';
import move from 'ember-animated/motions/move';
import { easeOut } from 'ember-animated/easings/cosine';
import { A } from '@ember/array';

export default class ColorsList extends Component {
  @service store;
  @service undoManager;

  @computed('args.palette.{colors.[],colorOrder.[],isColorHistory}')
  get sortedColors() {
    const { palette } = this.args;
    if (palette.isColorHistory) {
      return A(palette.colors).sortBy('createdAt').reverse();
    } else {
      return palette.colorOrder.map((color) => {
        return A(palette.colors).findBy('id', color.id);
      });
    }
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
    if (color && palette && !palette.isLocked) {
      const colorsList = palette.colors.map((color) => {
        return { type: 'color', id: color.id };
      });

      const colorToRemove = A(colorsList).findBy('id', color.id);
      colorsList.removeObject(colorToRemove);

      await this.store.update((t) => {
        const operations = [
          t.removeFromRelatedRecords(
            { type: 'palette', id: palette.id },
            'colors',
            { type: 'color', id: colorToRemove.id }
          ),
          t.replaceAttribute(
            { type: 'palette', id: palette.id },
            'colorOrder',
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

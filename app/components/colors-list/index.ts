import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';

import { easeOut } from 'ember-animated/easings/cosine';
import move from 'ember-animated/motions/move';
import { fadeOut } from 'ember-animated/motions/opacity';
import { Store } from 'ember-orbit';

import ColorModel from 'swach/data-models/color';
import PaletteModel from 'swach/data-models/palette';
import UndoManager from 'swach/services/undo-manager';

interface ColorsListArgs {
  palette: PaletteModel;
}

export default class ColorsList extends Component<ColorsListArgs> {
  @service store!: Store;
  @service undoManager!: UndoManager;

  get sortedColors(): (ColorModel | undefined)[] {
    const { palette } = this.args;
    if (palette.isColorHistory) {
      return palette.colors.sortBy('createdAt').reverse();
    } else {
      return palette.colorOrder.map((color: ColorModel) => {
        return palette.colors.findBy('id', color.id);
      });
    }
  }

  *transition({ keptSprites, insertedSprites, removedSprites }) {
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

  @action
  async deleteColor(color: ColorModel): Promise<void> {
    const { palette } = this.args;
    if (color && palette && !palette.isLocked) {
      const colorsList = palette.colors.map((color) => {
        return { type: 'color', id: color.id };
      });

      const colorToRemove = colorsList.findBy('id', color.id);

      if (colorToRemove) {
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
          if (color.palettes.length === 1 && color.palettes[0].isColorHistory) {
            operations.push(t.removeRecord({ type: 'color', id: color.id }));
          }

          return operations;
        });

        this.undoManager.setupUndoRedo();
      }
    }
  }
}

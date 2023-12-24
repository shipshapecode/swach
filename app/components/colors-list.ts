import { action } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';

import type Sprite from 'ember-animated/-private/sprite';
import { easeOut } from 'ember-animated/easings/cosine';
import move from 'ember-animated/motions/move';
import { fadeOut } from 'ember-animated/motions/opacity';
import type { Store } from 'ember-orbit';

import type { RecordOperationTerm } from '@orbit/records';

import 'swach/components/color-row';
import type ColorModel from 'swach/data-models/color';
import type PaletteModel from 'swach/data-models/palette';
import type UndoManager from 'swach/services/undo-manager';

interface ColorsListSignature {
  Args: {
    palette: PaletteModel;
    toggleColorPickerIsShown: (color?: ColorModel) => void;
  };
}

export default class ColorsListComponent extends Component<ColorsListSignature> {
  @service declare store: Store;
  @service declare undoManager: UndoManager;

  get sortedColors(): (ColorModel | undefined)[] | undefined {
    const { palette } = this.args;

    if (!palette.$isDisconnected) {
      if (palette.isColorHistory) {
        return palette.colors.sortBy('createdAt').reverse();
      } else {
        return palette.colorOrder.map((color: ColorModel) => {
          return palette.colors.findBy('id', color.id);
        });
      }
    }

    return undefined;
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
          const operations: RecordOperationTerm[] = [
            t.removeFromRelatedRecords(
              { type: 'palette', id: palette.id },
              'colors',
              { type: 'color', id: colorToRemove.id },
            ),
            t.replaceAttribute(
              { type: 'palette', id: palette.id },
              'colorOrder',
              colorsList,
            ),
            t.removeRecord(colorToRemove),
          ];

          return operations;
        });

        this.undoManager.setupUndoRedo();
      }
    }
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    ColorsList: typeof ColorsListComponent;
  }
}

import { action } from '@ember/object';
import Router from '@ember/routing/router-service';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';

import fade from 'ember-animated/transitions/fade';
import { Store } from 'ember-orbit';

import ColorModel from 'swach/data-models/color';
import PaletteModel from 'swach/data-models/palette';
import ColorUtils from 'swach/services/color-utils';
import UndoManager from 'swach/services/undo-manager';

interface KulerPaletteRowArgs {
  palette: PaletteModel;
  setSelectedIroColor: (index: number) => void;
}

export default class KulerPaletteRowComponent extends Component<KulerPaletteRowArgs> {
  @service colorUtils!: ColorUtils;
  @service router!: Router;
  @service store!: Store;
  @service undoManager!: UndoManager;

  fade = fade;
  showMenu = false;

  /**
   * Sets the selected color, and selects the palette if not already selected.
   * @param {Color} color The color to select
   * @param {Palette} palette The palette to select
   */
  @action
  setSelectedColor(color: ColorModel): void {
    const selectedColorIndex = this.args.palette.colors.indexOf(color);
    this.args.setSelectedIroColor(selectedColorIndex);
    this.args.palette.selectedColorIndex = selectedColorIndex;
  }

  @action
  async savePalette(): Promise<void> {
    await this.router.transitionTo('palettes');

    const { palette } = this.args;
    const { colors } = palette;

    await this.store.update((t) => {
      const paletteOperation = t.addRecord({
        type: 'palette',
        attributes: {
          name: this.args.palette.name,
          colorOrder: [],
          createdAt: new Date(),
          isColorHistory: false,
          isFavorite: false,
          isLocked: false
        }
      });

      const paletteId = paletteOperation.operation.record.id;

      const colorOperations = colors.map((color) => {
        const { createdAt, hex, name, r, g, b, a } = color;

        return t.addRecord({
          type: 'color',
          attributes: {
            createdAt,
            hex,
            name,
            r,
            g,
            b,
            a
          }
        });
      });
      const colorsList = colorOperations.map(({ operation }) => {
        return { type: 'color', id: operation.record.id };
      });

      return [
        paletteOperation,
        ...colorOperations,
        t.replaceRelatedRecords(
          { type: 'palette', id: paletteId },
          'colors',
          colorsList
        ),
        t.replaceAttribute(
          { type: 'palette', id: paletteId },
          'colorOrder',
          colorsList
        )
      ];
    });

    this.undoManager.setupUndoRedo();
  }
}

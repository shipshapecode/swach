import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import fade from 'ember-animated/transitions/fade';
import { action } from '@ember/object';

export default class KulerPaletteRowComponent extends Component {
  @service colorUtils;
  @service router;
  @service store;
  @service undoManager;

  fade = fade;
  showMenu = false;

  /**
   * Sets the selected color, and selects the palette if not already selected.
   * @param {Color} color The color to select
   * @param {Palette} palette The palette to select
   */
  @action
  setSelectedColor(color) {
    const selectedColorIndex = this.args.palette.colors.indexOf(color);
    this.args.setSelectedIroColor(selectedColorIndex);
    this.args.palette.selectedColorIndex = selectedColorIndex;
  }

  @action
  async savePalette() {
    await this.router.transitionTo('palettes');

    const { palette } = this.args;
    const { colors } = palette;

    await this.store.update(t => {
      let paletteOperation = t.addRecord({
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

      const paletteId = paletteOperation.record.id;

      const colorOperations = colors.map(color => {
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
      const colorsList = colorOperations.map(op => {
        return { type: 'color', id: op.record.id };
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

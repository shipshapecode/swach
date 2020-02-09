import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import fade from 'ember-animated/transitions/fade';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class KulerPaletteRowComponent extends Component {
  @service colorUtils;
  @service router;
  @service store;
  @service undoManager;

  fade = fade;
  showMenu = false;

  @tracked selectedColor;

  constructor() {
    super(...arguments);

    this.selectedColor = this.args.palette.colors[0];
  }

  get selectedColorIndex() {
    return this.args.palette.colors.indexOf(this.selectedColor);
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
        return t.addRecord({
          type: 'color',
          attributes: {
            createdAt: color.createdAt,
            hex: color.hex,
            name: color.name
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
        )
      ];
    });

    this.undoManager.setupUndoRedo();
  }
}

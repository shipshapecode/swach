import { action } from '@ember/object';
import type Router from '@ember/routing/router-service';
import { service } from '@ember/service';
import Component from '@glimmer/component';

import fade from 'ember-animated/transitions/fade';
import type { Store } from 'ember-orbit';

import type ColorModel from 'swach/data-models/color';
import type PaletteModel from 'swach/data-models/palette';
import type ColorUtils from 'swach/services/color-utils';
import type UndoManager from 'swach/services/undo-manager';

interface KulerPaletteRowSignature {
  Args: {
    palette: PaletteModel;
    setSelectedIroColor: (index: number) => void;
  };
}

export default class KulerPaletteRowComponent extends Component<KulerPaletteRowSignature> {
  @service declare colorUtils: ColorUtils;
  @service('-ea-motion') eaMotion!: any;
  @service declare router: Router;
  @service declare store: Store;
  @service declare undoManager: UndoManager;

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
    this.router.transitionTo('palettes');

    const { palette } = this.args;
    const { colors } = palette;

    const newColors = colors.map((color) => {
      const { createdAt, hex, name, r, g, b, a } = color;

      return {
        type: 'color',
        id: this.store.schema.generateId('color'),
        createdAt,
        hex,
        name,
        r,
        g,
        b,
        a
      };
    });

    const colorsList = newColors.map((color) => {
      return { type: 'color', id: color.id };
    });

    const newPalette = {
      type: 'palette',
      id: this.store.schema.generateId('palette'),
      name: this.args.palette.name,
      colors: colorsList,
      colorOrder: colorsList,
      createdAt: new Date(),
      index: 0,
      isColorHistory: false,
      isFavorite: false,
      isLocked: false
    };

    await this.eaMotion.waitUntilIdle.perform();

    await this.store.update((t) => [
      ...newColors.map((c) => t.addRecord(c)),
      t.addRecord(newPalette)
    ]);

    this.undoManager.setupUndoRedo();
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    KulerPaletteRow: typeof KulerPaletteRowComponent;
  }
}

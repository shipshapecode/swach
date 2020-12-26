import { action, set } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import { Store } from 'ember-orbit';

import { TinyColor } from '@ctrl/tinycolor';
import iro from '@jaames/iro';
import { clone } from '@orbit/utils';

import { SelectedColorPOJO } from 'swach/components/rgb-input';
import { rgbaToHex } from 'swach/data-models/color';
import UndoManager from 'swach/services/undo-manager';

interface ColorPickerArgs {
  selectedColor: SelectedColorPOJO;
}

export default class ColorPickerComponent extends Component<ColorPickerArgs> {
  @service nearestColor;
  @service router;
  @service store!: Store;
  @service undoManager!: UndoManager;

  get alternateColorFormats() {
    let hsl = '';
    let hsv = '';
    let rgb = '';

    if (this.selectedColor && this.selectedColor.hex) {
      const tinyColor = new TinyColor(this.selectedColor.hex);
      hsl = tinyColor.toHslString();
      hsv = tinyColor.toHsvString();
      rgb = tinyColor.toRgbString();
    }

    return { hsl, hsv, rgb };
  }

  @tracked selectedColor = null;

  @action
  initColorPicker(element) {
    this.onChange = (color) => {
      if (color) {
        this.setSelectedColor(color.rgba);
      }
    };

    const { selectedColor } = this.args;
    this.setSelectedColor(selectedColor ? selectedColor.hex : '#42445a');
    this._setupColorPicker(element, this.selectedColor.hex);
  }

  @action
  async saveColorAndClose() {
    const colorToEdit = this.args.selectedColor;
    // If we passed a color to edit, save it, otherwise create a new global color
    if (colorToEdit) {
      const { paletteId } = this.router.currentRoute.queryParams;
      const palette = await this.store.find('palette', paletteId);
      const colorCopy = clone(colorToEdit.getData());
      delete colorCopy.id;
      colorCopy.attributes = {
        ...this.selectedColor,
        createdAt: colorToEdit.createdAt
      };

      for (const attr in colorCopy.attributes) {
        // Remove private properties
        if (attr.startsWith('_')) {
          delete colorCopy.attributes[attr];
        }
      }

      // TODO: figure out what makes this case happen. This is guarding against when palette.colors is undefined, but it should never be.
      if (palette.colors) {
        const colorsList = palette.colors.map((color) => {
          return { type: 'color', id: color.id };
        });
        const colorsListRecord = colorsList.findBy('id', colorToEdit.id);
        const colorToEditIndex = colorsList.indexOf(colorsListRecord);
        colorsList.removeAt(colorToEditIndex);

        await this.store.update((t) => {
          const addColorOperation = t.addRecord(colorCopy);
          colorsList.insertAt(colorToEditIndex, {
            type: 'color',
            id: addColorOperation.operation.record.id
          });

          const operations = [
            addColorOperation,
            t.replaceRelatedRecords(
              { type: 'palette', id: palette.id },
              'colors',
              colorsList
            ),
            t.replaceAttribute(
              { type: 'palette', id: palette.id },
              'colorOrder',
              colorsList
            )
          ];

          // If the color only exists in in color history, and we remove it, we should delete the color
          if (
            colorToEdit.palettes.length === 1 &&
            colorToEdit.palettes[0].isColorHistory
          ) {
            operations.push(
              t.removeRecord({ type: 'color', id: colorToEdit.id })
            );
          }

          return operations;
        });

        this.undoManager.setupUndoRedo();
      }
    } else {
      this.args.saveColor(this.selectedColor.hex);
    }

    this.args.toggleIsShown();
  }

  @action
  destroyColorPicker() {
    this.colorPicker.off('color:change', this.onChange);
  }

  @action
  setSelectedColor(color) {
    const tinyColor = new TinyColor(color);
    const { r, g, b, a } = tinyColor.toRgb();
    const namedColor = this.nearestColor.nearest({ r, g, b });
    const hex = rgbaToHex(r, g, b, a);

    this.selectedColor = {
      _hex: hex,
      _r: r,
      _g: g,
      _b: b,
      _a: a,
      hex,
      name: namedColor.name,
      r,
      g,
      b,
      a
    };
  }

  @action
  updateColor() {
    const { r, g, b } = this.selectedColor;
    const namedColor = this.nearestColor.nearest({ r, g, b });
    set(this.selectedColor, 'name', namedColor.name);

    this.colorPicker.setColors([this.selectedColor].mapBy('hex'));
  }

  /**
   * Updates the internal, private input values
   * @param {string} key The key to the value to change
   * @param {number|string} value The value from the input mask
   */
  @action
  updateColorInputs(key, value) {
    set(this.selectedColor, `_${key}`, value);
  }

  @action
  _setupColorPicker(element, color) {
    this.colorPicker = new iro.ColorPicker(element, {
      colors: [color],
      layoutDirection: 'vertical',
      layout: [
        {
          component: iro.ui.Box,
          options: {
            borderColor: 'transparent',
            borderWidth: 0,
            width: 190
          }
        },
        {
          component: iro.ui.Slider,
          options: {
            borderColor: 'transparent',
            borderWidth: 0,
            margin: 20,
            sliderSize: 10,
            sliderType: 'hue',
            width: 300
          }
        },
        {
          component: iro.ui.Slider,
          options: {
            borderColor: 'transparent',
            borderWidth: 0,
            sliderSize: 10,
            sliderType: 'alpha',
            width: 300
          }
        }
      ],
      width: 207
    });

    this.colorPicker.on('color:change', this.onChange);
  }
}

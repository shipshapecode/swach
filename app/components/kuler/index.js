import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { capitalize } from '@ember/string';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import { TinyColor } from '@ctrl/tinycolor';
import iro from '@jaames/iro';

new iro.ColorPicker.prototype.setColors = function (
  newColorValues,
  selectedIndex = 0
) {
  // Unbind color events
  this.colors.forEach((color) => color.unbind());
  // Destroy old colors
  this.colors = [];
  // Add new colors
  newColorValues.forEach((colorValue) => this.addColor(colorValue));
  // Reset active color
  this.setActiveColor(selectedIndex);
};

export default class KulerComponent extends Component {
  @service colorUtils;
  @service store;

  harmonies = ['analogous', 'monochromatic', 'tetrad', 'triad'];

  @tracked baseColor;
  @tracked colors = [];
  @tracked palettes = [];
  @tracked selectedPalette;

  constructor() {
    super(...arguments);

    this.baseColor = this.args.baseColor;
    this.baseColorChanged().then(() => {
      this._setupColorWheel();

      if (typeof requireNode !== 'undefined') {
        let { ipcRenderer } = requireNode('electron');

        this.ipcRenderer = ipcRenderer;

        this._updateTouchbar();

        this.ipcRenderer.on('selectKulerColor', async (event, colorIndex) => {
          this.setSelectedIroColor(colorIndex);
        });

        this.ipcRenderer.on('updateKulerColor', async (event, color) => {
          await this._onColorChange(color);
          this.colorPicker.setColors(
            this.selectedPalette.colors.mapBy('hex'),
            this.selectedPalette.selectedColorIndex
          );
        });
      }
    });
  }

  @action
  async baseColorChanged() {
    // If we already had a selected palette, take note of which type analogous, monochromatic, etc
    // That way we can show the same type again even when the base changes
    const selectedPaletteTypeIndex = this.selectedPalette
      ? this.palettes.indexOf(this.selectedPalette)
      : 0;

    await this._destroyLeftoverPalettes();

    for (const harmony of this.harmonies) {
      class Palette {
        @tracked colors = [];
        @tracked selectedColorIndex = 0;

        constructor(harmony) {
          this.type = 'palette';
          this.name = capitalize(harmony);
          this.createdAt = new Date();
          this.isColorHistory = false;
          this.isFavorite = false;
          this.isLocked = false;
        }
      }

      const palette = new Palette(harmony);

      let colors = new TinyColor(this.baseColor.hex)[harmony](5);
      colors = colors.map((color) => {
        return this.colorUtils.createColorPOJO(color.toHexString());
      });
      colors = colors.map((color) => color.attributes);

      palette.colors.pushObjects(colors);
      this.palettes.pushObject(palette);
    }

    this.selectedPalette = this.palettes[selectedPaletteTypeIndex];
  }

  willDestroy() {
    this._destroyLeftoverPalettes();
    this.colorPicker.off('color:change', this._onColorChange);
    this.colorPicker.off('color:setActive', this._onColorSetActive);
  }

  @action
  setColorAsBase() {
    this.baseColor = this.selectedPalette.colors[
      this.selectedPalette.selectedColorIndex
    ];
    return this.baseColorChanged().then(() => {
      this.colorPicker.setColors(
        this.selectedPalette.colors.mapBy('hex'),
        this.selectedPalette.selectedColorIndex
      );
    });
  }

  /**
   * Sets the selected color in the iro.js color wheel
   * @param {number} index The index of the color to make active
   */
  @action
  setSelectedIroColor(index) {
    this.colorPicker.setActiveColor(index);
  }

  /**
   * Sets the selected palette and the colors for the color picker
   * @param {Palette} palette
   */
  @action
  setSelectedPalette(e) {
    const paletteName = e.target.value;
    const palette = this.palettes.findBy('name', paletteName);
    this.selectedPalette = palette;
    this.colorPicker.setColors(
      this.selectedPalette.colors.mapBy('hex'),
      palette.selectedColorIndex
    );

    this._updateTouchbar();
  }

  @action
  async _destroyLeftoverPalettes() {
    this.palettes = [];
  }

  @action
  async _onColorChange(color) {
    // TODO figure out how to choose base colors
    const { selectedColorIndex } = this.selectedPalette;
    // if changing the selected baseColor, we should update all the colors
    // if (selectedColorIndex === 0) {
    //   const newColor = this.colorUtils.createColorPOJO(color.rgba);
    //   this.baseColor = newColor.attributes;
    //   await this.baseColorChanged();
    // } else {
    const newColor = this.colorUtils.createColorPOJO(color?.rgba ?? color);
    this.selectedPalette.colors.replace(selectedColorIndex, 1, [
      newColor.attributes
    ]);
    // }

    this.colorPicker.setColors(
      this.selectedPalette.colors.mapBy('hex'),
      this.selectedPalette.selectedColorIndex
    );

    this._updateTouchbar();
  }

  @action
  _onColorSetActive(color) {
    if (color) {
      this.selectedPalette.selectedColorIndex = color.index;
    }
  }

  @action
  _setupColorWheel() {
    this.colorPicker = new iro.ColorPicker('#kuler-color-picker-container', {
      colors: this.selectedPalette.colors.mapBy('hex'),
      layoutDirection: 'horizontal',
      layout: [
        {
          component: iro.ui.Slider,
          options: {
            borderColor: 'transparent',
            borderWidth: 0,
            sliderSize: 10,
            sliderType: 'alpha',
            width: 250
          }
        },
        {
          component: iro.ui.Slider,
          options: {
            borderColor: 'transparent',
            borderWidth: 0,
            margin: 25,
            sliderSize: 10,
            sliderType: 'value',
            width: 250
          }
        },
        {
          component: iro.ui.Wheel,
          options: {
            borderColor: 'transparent',
            borderWidth: 0,
            margin: 30,
            width: 225
          }
        }
      ],
      width: 207
    });

    this.colorPicker.on('color:change', this._onColorChange);
    this.colorPicker.on('color:setActive', this._onColorSetActive);
  }

  @action
  _updateTouchbar() {
    if (this.ipcRenderer) {
      const itemsToShow = {
        colorPicker: true,
        kulerColors: {
          colors: this.selectedPalette.colors
        }
      };

      this.ipcRenderer.send('setTouchbar', itemsToShow);
    }
  }
}

import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { capitalize } from '@ember/string';
import { tracked } from '@glimmer/tracking';
import { TinyColor } from '@ctrl/tinycolor';
import iro from '@jaames/iro';

iro.ColorPicker.prototype.setColors = function(
  newColorValues,
  selectedIndex = 0
) {
  // Unbind color events
  this.colors.forEach(color => color.unbind());
  // Destroy old colors
  this.colors = [];
  // Add new colors
  newColorValues.forEach(colorValue => this.addColor(colorValue));
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
    });
  }

  @action
  async baseColorChanged() {
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
      colors = await Promise.all(
        colors.map(async color => {
          return this.colorUtils.createColorPOJO(color.toHexString());
        })
      );
      colors = colors.map(color => color.attributes);

      palette.colors.pushObjects(colors);
      this.palettes.pushObject(palette);
    }

    this.selectedPalette = this.palettes[0];
  }

  willDestroy() {
    this._destroyLeftoverPalettes();
    this.colorPicker.off('color:change', this._onColorChange);
    this.colorPicker.off('color:setActive', this._onColorSetActive);
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
  setSelectedPalette(palette) {
    this.selectedPalette = palette;
    this.colorPicker.setColors(
      this.selectedPalette.colors.mapBy('hex'),
      palette.selectedColorIndex
    );
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
    //   const newColor = await this.colorUtils.createColorPOJO(color.rgba);
    //   this.baseColor = newColor.attributes;
    //   await this.baseColorChanged();
    // } else {
      const newColor = await this.colorUtils.createColorPOJO(color.rgba);
      this.selectedPalette.colors.replace(selectedColorIndex, 1, [
        newColor.attributes
      ]);
    // }
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
}

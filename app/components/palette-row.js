import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class PaletteRowComponent extends Component {
  @action
  addColorToPalette(color, ops) {
    const palette = ops.target.palette;
    palette.colors.pushObject(color);
  }
}

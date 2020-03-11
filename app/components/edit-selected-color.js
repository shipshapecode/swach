import Component from '@glimmer/component';

export default class EditSelectedColorComponent extends Component {
  get selectedColor() {
    const { palette } = this.args;
    if (palette) {
      const { colors } = palette;
      return colors[palette.selectedColorIndex];
    }

    return {};
  }
}

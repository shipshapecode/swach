import Controller, {
  inject as controller
} from '@ember/controller';
import { action } from '@ember/object';
import colorNameList from 'color-name-list';
import nearestColor from 'nearest-color';

export default class IndexController extends Controller {
  @controller application;

  init() {
    super.init(...arguments);

    const namedColors = colorNameList.reduce((o, { name, hex }) => Object.assign(o, { [name]: hex }), {});

    this.nearest = nearestColor.from(namedColors);
    let { ipcRenderer } = requireNode('electron');
    this.ipcRenderer = ipcRenderer;
    this.ipcRenderer.on('changeColor', (event, color) => {
      this.addColor(color);
    });
  }

  @action
  addColor(color) {
    const namedColor = this.nearest(color);

    const colorRecord = this.store.createRecord('color', {
      hex: color,
      name: namedColor.name
    });

    colorRecord.save();
  }
}

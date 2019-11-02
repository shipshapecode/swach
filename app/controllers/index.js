import Controller, {
  inject as controller
} from '@ember/controller';
import colorNameList from 'color-name-list';
import nearestColor from 'nearest-color';

export default class IndexController extends Controller {
  @controller application;

  init() {
    super.init(...arguments);

    const namedColors = colorNameList.reduce((o, { name, hex }) => Object.assign(o, { [name]: hex }), {});

    const nearest = nearestColor.from(namedColors);
    let { ipcRenderer } = requireNode('electron');
    this.ipcRenderer = ipcRenderer;
    this.ipcRenderer.on('changeColor', (event, color) => {
      const namedColor = nearest(color);

      const colorRecord = this.store.createRecord('color', {
        hex: color,
        name: namedColor.name
      });

      colorRecord.save();
    });
  }

  model() {
    super.model(...arguments);

    return this.store.findAll('color');
  }
}

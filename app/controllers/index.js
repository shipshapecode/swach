import Controller, {
  inject as controller
} from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class IndexController extends Controller {
  @controller application;
  @service nearestColor;

  @tracked menuIsShown = false;

  init() {
    super.init(...arguments);

    let { ipcRenderer } = requireNode('electron');
    this.ipcRenderer = ipcRenderer;
    this.ipcRenderer.on('changeColor', (event, color) => {
      this.addColor(color);
    });
  }

  @action
  addColor(color) {
    const namedColor = this.nearestColor.nearest(color);

    const colorRecord = this.store.createRecord('color', {
      hex: color,
      name: namedColor.name
    });

    colorRecord.save();
  }

  @action toggleMenuIsShown() {
    this.menuIsShown = !this.menuIsShown;
  }
}

import Controller, {
  inject as controller
} from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class ColorManagerController extends Controller {
  @controller application;
  @service nearestColor;

  @tracked menuIsShown = false;

  init() {
    super.init(...arguments);

    if (typeof requireNode !== 'undefined') {
      let { ipcRenderer } = requireNode('electron');
      this.ipcRenderer = ipcRenderer;
      this.ipcRenderer.on('changeColor', (event, color) => {
        const addedColor = this.addColor(color);
        this.copyColorToClipboard(addedColor);
      });
    }
  }

  @action
  addColor(color) {
    const namedColor = this.nearestColor.nearest(color);

    const colorRecord = this.store.createRecord('color', {
      hex: color,
      name: namedColor.name
    });

    colorRecord.save();

    return colorRecord;
  }

  @action
  copyColorToClipboard(color) {
    this.ipcRenderer.send('copyColorToClipboard', color.hex);

    new window.Notification(`${color.name} - ${color.hex}`, {
      body: `${color.hex} copied to clipboard!`
    });
  }

  @action toggleMenuIsShown() {
    this.menuIsShown = !this.menuIsShown;
  }
}

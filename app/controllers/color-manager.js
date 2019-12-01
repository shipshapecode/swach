import Controller, {
  inject as controller
} from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class ColorManagerController extends Controller {
  @controller application;
  @service colorUtils;
  @service nearestColor;

  @tracked menuIsShown = false;

  init() {
    super.init(...arguments);

    if (typeof requireNode !== 'undefined') {
      let { ipcRenderer } = requireNode('electron');
      this.ipcRenderer = ipcRenderer;
      this.ipcRenderer.on('changeColor', async (event, color) => {
        const addedColor = await this.addColor(color);
        this.colorUtils.copyColorToClipboard(addedColor);
      });
    }
  }

  @action
  async addColor(color) {
    const namedColor = this.nearestColor.nearest(color);

    const colorRecord = this.store.createRecord('color', {
      hex: color,
      name: namedColor.name
    });

    await colorRecord.save();

    const palettes = await this.store.findAll('palette');
    const colorHistory = palettes.findBy('isColorHistory', true);
    colorHistory.colors.pushObject(colorRecord);
    await colorHistory.save();

    return colorRecord;
  }

  @action
  toggleMenuIsShown() {
    this.menuIsShown = !this.menuIsShown;
  }
}

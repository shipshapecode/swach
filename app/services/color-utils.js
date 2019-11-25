import Service from '@ember/service';
import { action } from '@ember/object';

export default class ColorUtilsService extends Service {
  init() {
    super.init(...arguments);

    if (typeof requireNode !== 'undefined') {
      let { ipcRenderer } = requireNode('electron');
      this.ipcRenderer = ipcRenderer;
    }
  }

  @action
  copyColorToClipboard(color) {
    this.ipcRenderer.send('copyColorToClipboard', color.hex);

    new window.Notification(`${color.name} - ${color.hex}`, {
      body: `${color.hex} copied to clipboard!`,
      silent: true
    });
  }
}

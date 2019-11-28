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
  copyColorToClipboard(color, event) {
    const isDropping = event &&
      event.target &&
      event.target.parentElement &&
      event.target.parentElement.classList.contains('is-dropping');

    if (!isDropping) {
      this.ipcRenderer.send('copyColorToClipboard', color.hex);

      new window.Notification(`${color.name} - ${color.hex}`, {
        body: `${color.hex} copied to clipboard!`,
        silent: true
      });
    }
  }
}

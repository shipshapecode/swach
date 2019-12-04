import Service from '@ember/service';
import { action, get } from '@ember/object';
import { storageFor } from 'ember-local-storage';

export default class ColorUtilsService extends Service {
  @storageFor('settings') settings;

  init() {
    super.init(...arguments);

    if (typeof requireNode !== 'undefined') {
      let { ipcRenderer } = requireNode('electron');
      this.ipcRenderer = ipcRenderer;
    }
  }

  @action
  copyColorToClipboard(color, event) {
    const isDropping =
      event &&
      event.target &&
      event.target.parentElement &&
      event.target.parentElement.classList.contains('is-dropping');

    if (!isDropping) {
      this.ipcRenderer.send('copyColorToClipboard', color.hex);

      if (get(this, 'settings.sounds')) {
        const audio = new Audio('/sounds/pluck_short.wav');
        audio.play();
      }
      new window.Notification(`${color.name} - ${color.hex}`, {
        body: `${color.hex} copied to clipboard!`,
        silent: true
      });
    }
  }
}

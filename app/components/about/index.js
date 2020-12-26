import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

export default class SettingsMenu extends Component {
  @tracked version = 'Version not available';

  constructor() {
    super(...arguments);

    if (typeof requireNode !== 'undefined') {
      let { ipcRenderer } = requireNode('electron');
      this.ipcRenderer = ipcRenderer;

      this.ipcRenderer.invoke('getAppVersion').then((version) => {
        this.version = version;
      });
    }
  }

  @action
  visitWebsite(event) {
    event.preventDefault();
    if (typeof requireNode !== 'undefined') {
      requireNode('electron').shell.openExternal('https://swach.io/');
    }
  }
}

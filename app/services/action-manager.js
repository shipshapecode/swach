import Service from '@ember/service';
import { isArray } from '@ember/array';
import { action } from '@ember/object';

export default class ActionManagerService extends Service {
  changedQueue = null;

  init() {
    super.init(...arguments);

    this.changedQueue = [];

    document.addEventListener('keydown', (e) => {      
      const key = e.which || e.keyCode;
      // testing for CMD or CTRL
      const ctrl = (e.ctrlKey || e.metaKey) ? (e.ctrlKey || e.metaKey) : ((key === 17) ? true : false);
      const isUndo = ctrl && key === 90;
      const isRedo = isUndo && e.shiftKey;
      
      if (isUndo) {
        console.log('Ctrl + Z Pressed');
        // call undo on last tracked action
        const last = this.changedQueue.popObject();
        
        if (last) {
          last.undo();
          last.save();
        }
      }
      if (isRedo) {
        console.log('Shift + Ctrl + Z Pressed');
        // call redo on last tracked action
      }
    }, true);
  }

  @action
  async trackAndSave(model) {
    if (isArray(model)) {
      return model.forEach(item => {
        this.trackAndSave(item);
      });
    }
    await model.save();
    this.changedQueue.push(model);

    return model;
  }
}

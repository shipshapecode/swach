import Service from '@ember/service';
import { inject as service } from '@ember/service';
import UndoManager from 'undo-manager';

export default class UndoManagerService extends Service {
  @service store;
  
  constructor() {
    super(...arguments);

    this._setupKeyEvents();
    this.undoManager = new UndoManager();
  }

  add() {
    return this.undoManager.add(...arguments);
  }

  clear() {
    return this.undoManager.clear();
  }

  redo() {
    return this.undoManager.redo();
  }

  undo() {
    return this.undoManager.undo();
  }

  setupUndoRedo() {
    const transformId = this.store.transformLog.head;
    const redoTransform = this.store.getTransform(transformId).operations;
    const undoTransform = this.store.getInverseOperations(transformId);

    const undo = async () => {
      await this.store.update(undoTransform);
    };

    const redo = async () => {
      await this.store.update(redoTransform);
    };

    this.add({ undo, redo });
  }

  _setupKeyEvents() {
    document.addEventListener(
      'keydown',
      async e => {
        const key = e.which || e.keyCode;
        // testing for CMD or CTRL
        const ctrl =
          e.ctrlKey || e.metaKey
            ? e.ctrlKey || e.metaKey
            : key === 17
            ? true
            : false;
        const isUndo = ctrl && key === 90;
        const isRedo = isUndo && e.shiftKey;

        if (isRedo) {
          await this.redo();
        } else if (isUndo) {
          await this.undo();
        }
      },
      true
    );
  }
}

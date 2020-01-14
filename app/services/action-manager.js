import Service from '@ember/service';
import { isArray } from '@ember/array';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class ActionManagerService extends Service {
  @service store;

  changedQueue = null;
  redoQueue = null;

  init() {
    super.init(...arguments);

    this.changedQueue = [];
    this.redoQueue = [];

    document.addEventListener(
      'keydown',
      e => {
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

        if (isUndo) {
          // call undo on last tracked action
          const last = this.changedQueue.popObject();

          if (last) {
            this.undoRedoChanges(last);
          }
        }
        if (isRedo) {
          // call redo on last tracked action
          const last = this.redoQueue.popObject();

          if (last) {
            this.undoRedoChanges(last, true);
          }
        }
      },
      true
    );
  }

  @action
  async trackAndSave(model, queue = 'changed') {
    if (isArray(model)) {
      return model.forEach(item => {
        this.trackAndSave(item);
      });
    }

    const changedFields = Object.keys(model.modelChanges());
    const changesArray = changedFields.map(field => {
      const changedObj = {};
      const fieldsChanged = model.savedTrackerValue(field);

      changedObj[field] = model[field]._objects.filter(item =>
        fieldsChanged.includes(item.id)
      );

      return changedObj;
    });

    this[`${queue}Queue`].push({
      changedId: model.id,
      changedType: model._internalModel.modelName,
      changes: changesArray
    });
    await model.save();

    return model;
  }

  @action
  async undoRedoChanges(changedState, isRedo = false) {
    const current = this.store.peekRecord(
      changedState.changedType,
      changedState.changedId
    );
    changedState.changes.forEach(change => {
      Object.keys(change).forEach(key => {
        current.set(key, change[key]);
      });
    });

    if (isRedo) {
      await this.trackAndSave(current, 'redo');
    } else {
      await this.trackAndSave(current);
    }
  }
}

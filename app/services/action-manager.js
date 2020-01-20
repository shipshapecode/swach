import Service from '@ember/service';
import { isArray } from '@ember/array';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { singularize } from 'ember-inflector';

export const ModelTrackerKey = '-change-tracker';
export const RelationshipsKnownTrackerKey = '-change-tracker-relationships-known';

export default class ActionManagerService extends Service {
  @service store;

  changedQueue = null;
  redoQueue = null;

  constructor() {
    super(...arguments);

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

        if (isRedo) {
          // call redo on last tracked action
          const last = this.redoQueue.popObject();

          if (last) {
            this.undoRedoChanges(last, true);
          }
        } else if (isUndo) {
          // call undo on last tracked action
          const last = this.changedQueue.popObject();

          if (last) {
            this.undoRedoChanges(last);
          }
        }
      },
      true
    );
  }


  /**
   * _resetQueue - intended to reset queues for use in testing
   * @private
   */
  @action
  _resetQueue() {
    this.changedQueue = [];
    this.redoQueue = [];
  }

  @action
  async trackAndSave(model, queue = 'changed') {
    if (isArray(model)) {
      return model.forEach(item => {
        this.trackAndSave(item);
      });
    }

    const changes = Object.keys(model.modelChanges()).reduce((prev, next) => {
      const changed = {};
      const relationships = Object.keys(model[RelationshipsKnownTrackerKey]);
      const isRelation = relationships.includes(next);
      let trackedChange = model[ModelTrackerKey][next];

      if (isRelation) {
        trackedChange = isArray(trackedChange) ? trackedChange.map(item => this.store.peekRecord(singularize(next), item)) : this.store.peekRecord(singularize(next), trackedChange);
      }

      changed[next] = trackedChange;
      prev.push(changed);

      return prev;
    }, []);

    this[`${queue}Queue`].push({
      changedId: model.id,
      changedType: model.constructor.modelName,
      changes
    });
    await model.save();

    return model;
  }

  @action
  async undoRedoChanges(changedState, isRedo = false) {
    const { changedId, changedType } = changedState;
    const current = this.store.peekRecord(changedType, changedId);

    if (!current) return;

    changedState.changes.forEach(change => {
      Object.keys(change).forEach(key => {
        current.set(key, change[key]);
      });
    });

    if (isRedo) {
      await this.trackAndSave(current);
    } else {
      await this.trackAndSave(current, 'redo');
    }
  }
}

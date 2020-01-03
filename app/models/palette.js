import Model, { attr, hasMany } from '@ember-data/model';
import { computed } from '@ember/object';
import Copyable from 'ember-data-copyable';
import UndoStack from 'ember-undo-stack/undo-stack';

export default class PaletteModel extends Model.extend(Copyable, UndoStack) {
  @attr('number') index;
  @attr('string') name;

  @attr('date', {
    defaultValue() {
      return new Date();
    }
  })
  createdAt;

  @attr('boolean', {
    defaultValue() {
      return false;
    }
  })
  isColorHistory;

  @attr('boolean', {
    defaultValue() {
      return false;
    }
  })
  isFavorite;

  @attr('boolean', {
    defaultValue() {
      return false;
    }
  })
  isLocked;

  @hasMany('color', { inverse: 'palettes' }) colors;

  @computed('colors')
  get checkpointData() {
    return {
      colors: this.colors.map(color => color)
    };
  }

  restoreCheckpoint(data) {
    return this.set('colors', data.colors);
  }
}

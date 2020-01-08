import Model, { attr, hasMany } from '@ember-data/model';
import Copyable from 'ember-data-copyable';

export default class PaletteModel extends Model.extend(Copyable) {
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
}

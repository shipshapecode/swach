import Model, { attr, hasMany } from '@ember-data/model';
import Copyable from 'ember-data-copyable';

export default class PaletteModel extends Model.extend(Copyable) {
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
  @attr('string') name;

  @hasMany('color', { inverse: 'palettes' }) colors;
}

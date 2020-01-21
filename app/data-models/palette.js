import { Model, attr, hasMany } from 'ember-orbit';

export default class PaletteModel extends Model {
  @attr('number') index;
  @attr('string') name;

  @attr('date', {
    defaultValue() {
      return new Date();
    }
  })
  createdAt;

  @attr('boolean', { defaultValue: false }) isColorHistory;
  @attr('boolean', { defaultValue: false }) isFavorite;
  @attr('boolean', { defaultValue: false }) isLocked;

  @hasMany('color', { inverse: 'palettes' }) colors;
}

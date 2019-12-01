import Model, { attr, hasMany } from '@ember-data/model';

export default class PaletteModel extends Model {
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

  @hasMany('color') colors;
}

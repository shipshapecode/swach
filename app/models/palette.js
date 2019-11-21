import Model, { attr, hasMany } from '@ember-data/model';

export default class PaletteModel extends Model {
  @attr('string') name;
  @attr('date', {
    defaultValue() { return new Date(); }
  }) createdAt;

  @hasMany('color') colors;
}

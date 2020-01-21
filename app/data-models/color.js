import { Model, attr, hasMany } from 'ember-orbit';

export default class ColorModel extends Model {
  @attr('string') hex;
  @attr('number') index;
  @attr('string') name;
  @attr('date', {
    defaultValue() {
      return new Date();
    }
  })
  createdAt;

  @hasMany('palette', { inverse: 'colors' }) palettes;
}

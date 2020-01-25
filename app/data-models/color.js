import { Model, attr, hasMany } from 'ember-orbit';

export default class ColorModel extends Model {
  @attr('date') createdAt;
  @attr('string') hex;
  @attr('string') name;

  @hasMany('palette', { inverse: 'colors' }) palettes;
}

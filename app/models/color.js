import Model, { attr, hasMany } from '@ember-data/model';
import Copyable from 'ember-data-copyable';

export default class ColorModel extends Model.extend(Copyable) {
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

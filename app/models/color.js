import Model, { attr } from '@ember-data/model';

export default class ColorModel extends Model {
  @attr('string') hex;
  @attr('string') name;
  @attr('date', {
    defaultValue() { return new Date(); }
  }) createdAt;
}

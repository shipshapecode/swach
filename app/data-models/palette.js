import { Model, attr, hasMany } from 'ember-orbit';

export default class PaletteModel extends Model {
  @attr('date') createdAt;
  @attr('number') index;
  @attr('boolean') isColorHistory;
  @attr('boolean') isFavorite;
  @attr('boolean') isLocked;
  @attr('string') name;

  @hasMany('color', { inverse: 'palettes' }) colors;
}

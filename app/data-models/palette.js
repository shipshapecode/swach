import { Model, attr, hasMany } from 'ember-orbit';

export default class PaletteModel extends Model {
  @attr('date') createdAt;
  @attr('number') index;
  @attr('boolean') isColorHistory;
  @attr('boolean') isFavorite;
  @attr('boolean') isLocked;
  @attr('string') name;
  // This is an array to track color order, and is a hack until orbit supports ordered relationships
  @attr() colorOrder;

  @hasMany('color', { inverse: 'palettes' }) colors;
}

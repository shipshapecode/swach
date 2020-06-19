import { Model, attr, hasMany, belongsTo } from 'ember-orbit';

export default class PaletteModel extends Model {
  @attr('date') createdAt;
  @attr('number') index;
  @attr('boolean') isColorHistory;
  @attr('boolean') isFavorite;
  @attr('boolean') isLocked;
  @attr('string') name;
  @attr('number') selectedColorIndex;
  // This is an array to track color order, and is a hack until orbit supports ordered relationships
  @attr() colorOrder;

  @belongsTo('user') user;
  @hasMany('color', { inverse: 'palettes' }) colors;
}

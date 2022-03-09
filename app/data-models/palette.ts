import { Model, attr, hasMany } from 'ember-orbit';

import ColorModel from 'swach/data-models/color';

export default class PaletteModel extends Model {
  @attr('datetime') createdAt!: string;
  @attr('number') index!: number;
  @attr('boolean') isColorHistory!: boolean;
  @attr('boolean') isFavorite!: boolean;
  @attr('boolean') isLocked!: boolean;
  @attr('string') name!: string;
  @attr('number') selectedColorIndex!: number;
  // This is an array to track color order, and is a hack until orbit supports ordered relationships
  @attr('array') colorOrder!: { type: string; id: string }[];

  @hasMany('color', { inverse: 'palette', dependent: 'remove' })
  colors!: ColorModel[];
}

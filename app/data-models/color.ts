import { isEmpty } from '@ember/utils';

import { Model, attr, hasMany } from 'ember-orbit';

import { TinyColor } from '@ctrl/tinycolor';

import PaletteModel from 'swach/data-models/palette';

export default class ColorModel extends Model {
  @attr('date') createdAt!: string;
  @attr('string') name!: string;
  @attr('number') r!: number;
  @attr('number') g!: number;
  @attr('number') b!: number;
  @attr('number') a!: number;

  @hasMany('palette', { inverse: 'colors' }) palettes!: PaletteModel[];

  get hex(): string {
    const { r, g, b, a } = this;
    return rgbaToHex(r, g, b, a);
  }

  get rgba(): string {
    const { r, g, b, a } = this;
    return new TinyColor({ r, g, b, a }).toRgbString();
  }
}

export function rgbaToHex(r: number, g: number, b: number, a: number): string {
  if (isEmpty(a) || a === 1) {
    return new TinyColor({ r, g, b, a }).toHexString();
  }

  return new TinyColor({ r, g, b, a }).toHex8String();
}

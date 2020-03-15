import { Model, attr, hasMany } from 'ember-orbit';
import { TinyColor } from '@ctrl/tinycolor';
import { isEmpty } from '@ember/utils';

export default class ColorModel extends Model {
  @attr('date') createdAt;
  @attr('string') name;
  @attr('number') r;
  @attr('number') g;
  @attr('number') b;
  @attr('number') a;

  @hasMany('palette', { inverse: 'colors' }) palettes;

  get hex() {
    const { r, g, b, a } = this;
    return rgbaToHex(r, g, b, a);
  }

  get rgba() {
    const { r, g, b, a } = this;
    return new TinyColor({ r, g, b, a }).toRgbString();
  }
}

export function rgbaToHex(r, g, b, a) {
  if (isEmpty(a) || a === 1) {
    return new TinyColor({ r, g, b, a }).toHexString();
  }

  return new TinyColor({ r, g, b, a }).toHex8String();
}

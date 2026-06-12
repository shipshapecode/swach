import Service from '@ember/service';

import { colornames } from 'color-name-list';
import nearestColor, { type ColorMatch, type RGB } from 'nearest-color';

export default class NearestColorService extends Service {
  nearest: (color: string | RGB) => ColorMatch;

  constructor() {
    super(...arguments);

    const namedColors = colornames.reduce(
      (
        o: { [key: string]: string },
        { name, hex }: { name: string; hex: string }
      ) => Object.assign(o, { [name]: hex }),
      {}
    );

    this.nearest = nearestColor.from(namedColors);
  }
}

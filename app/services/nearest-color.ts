import Service from '@ember/service';

// @ts-expect-error We do not need types for the colors list or nearest color
import colorNameList from 'color-name-list';
// @ts-expect-error We do not need types for the colors list or nearest color
import nearestColor from 'nearest-color';

export default class NearestColorService extends Service {
  nearest: ({
    r,
    g,
    b
  }: {
    r: number;
    g: number;
    b: number;
  }) => { name: string };

  constructor() {
    super(...arguments);

    const namedColors = colorNameList.reduce(
      (
        o: { [key: string]: string },
        { name, hex }: { name: string; hex: string }
      ) => Object.assign(o, { [name]: hex }),
      {}
    );

    this.nearest = nearestColor.from(namedColors);
  }
}

import Service from '@ember/service';
import colorNameList from 'color-name-list';
import nearestColor from 'nearest-color';

export default class NearestColorService extends Service {
  nearest: ({ r, g, b }: { r: number; g: number; b: number }) => {
    name: string;
  };

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

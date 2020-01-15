import Service from '@ember/service';
import colorNameList from 'color-name-list';
import nearestColor from 'nearest-color';

export default class NearestColorService extends Service {
  constructor() {
    super(...arguments);

    const namedColors = colorNameList.reduce((o, { name, hex }) => Object.assign(o, { [name]: hex }), {});

    this.nearest = nearestColor.from(namedColors);
  }
}

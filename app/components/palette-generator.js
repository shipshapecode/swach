import Component from '@ember/component';
import { action, set } from '@ember/object';
import { Harmonizer } from 'color-harmony';

export default class PaletteGenerator extends Component {
  baseColor = null;
  harmonies = null;
  harmonizer = new Harmonizer();
  selectedHarmony = null;

  didReceiveAttrs() {
    super.didReceiveAttrs(...arguments);

    const harmoniesHash = this.harmonizer.harmonizeAll(this.baseColor);

    set(this, 'harmonies', Object.keys(harmoniesHash).map((key) => {
      return { key, value: harmoniesHash[key] };
    }));
  }

  @action
  selectHarmony(harmony) {
    if (harmony && harmony.value) {
      set(this, 'selectedHarmony', harmony.value);
    }
  }
}

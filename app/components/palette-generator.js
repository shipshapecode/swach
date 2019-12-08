import Component from '@ember/component';
import { action, set } from '@ember/object';
import { tagName } from '@ember-decorators/component';
import { Harmonizer } from 'color-harmony';

@tagName('')
export default class PaletteGenerator extends Component {
  baseColor = null;
  harmonies = null;
  harmonizer = new Harmonizer();
  selectedHarmony = null;

  didReceiveAttrs() {
    super.didReceiveAttrs(...arguments);

    const harmoniesHash = this.harmonizer.harmonizeAll(this.baseColor.hex);

    set(this, 'harmonies', Object.keys(harmoniesHash).map((key) => {
      return { key, value: harmoniesHash[key] };
    }));
  }

  @action
  selectHarmony(harmony) {
    if (harmony && harmony.value) {
      set(this, 'selectedHarmony', harmony);
    }
  }
}

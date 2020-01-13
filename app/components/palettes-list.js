import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class PalettesListComponent extends Component {
  get orderedPalettes() {
    return this.args.palettes.sortBy('index');
  }

  @action
  reorderPalettes({ sourceList, sourceIndex, targetList, targetIndex }) {
    if (sourceList === targetList && sourceIndex === targetIndex) return;

    const movedItem = sourceList.objectAt(sourceIndex);

    sourceList.removeAt(sourceIndex);
    targetList.insertAt(targetIndex, movedItem);

    targetList.forEach((palette, index) => {
      palette.set('index', index);
    });

    return Promise.all(targetList.invoke('save'));
  }
}

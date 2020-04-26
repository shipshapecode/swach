import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class PalettesListComponent extends Component {
  @service store;
  @service undoManager;

  /**
   * Order palettes by createdAt first, then order by index if the user
   * has reordered them.
   */
  get orderedPalettes() {
    return this.args.palettes.sortBy('createdAt').reverse().sortBy('index');
  }

  @action
  async reorderPalettes({ sourceList, sourceIndex, targetList, targetIndex }) {
    if (sourceList === targetList && sourceIndex === targetIndex) return;

    const movedItem = sourceList.objectAt(sourceIndex);

    sourceList.removeAt(sourceIndex);
    targetList.insertAt(targetIndex, movedItem);

    await this.store.update((t) => {
      const operations = [];

      targetList.forEach((palette, index) => {
        operations.push(
          t.replaceAttribute(
            { type: 'palette', id: palette.id },
            'index',
            index
          )
        );
      });

      return operations;
    });

    this.undoManager.setupUndoRedo();
  }
}

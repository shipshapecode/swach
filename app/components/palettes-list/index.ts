import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';

import { Store } from 'ember-orbit';

import { OperationTerm } from '@orbit/data/src/operation-term';

import PaletteModel from 'swach/data-models/palette';
import UndoManager from 'swach/services/undo-manager';

interface PalettesListArgs {
  palettes: PaletteModel[];
}

export default class PalettesListComponent extends Component<PalettesListArgs> {
  @service store!: Store;
  @service undoManager!: UndoManager;

  /**
   * Order palettes by createdAt first, then order by index if the user
   * has reordered them.
   */
  get orderedPalettes(): PaletteModel[] {
    return this.args.palettes.sortBy('createdAt').reverse().sortBy('index');
  }

  @action
  async reorderPalettes({
    sourceList,
    sourceIndex,
    targetList,
    targetIndex
  }: {
    sourceList: PaletteModel[];
    sourceIndex: number;
    targetList: PaletteModel[];
    targetIndex: number;
  }): Promise<void> {
    if (sourceList === targetList && sourceIndex === targetIndex) return;

    const movedItem = sourceList.objectAt(sourceIndex) as PaletteModel;

    sourceList.removeAt(sourceIndex);
    targetList.insertAt(targetIndex, movedItem);

    await this.store.update((t) => {
      const operations: OperationTerm[] = [];

      targetList.forEach((palette: PaletteModel, index: number) => {
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

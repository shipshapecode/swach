import { action } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';

import { LiveQuery, Store } from 'ember-orbit';

import type { RecordOperationTerm } from '@orbit/records';

import type PaletteModel from 'swach/data-models/palette';
import type UndoManager from 'swach/services/undo-manager';

interface PalettesListSignature {
  Element: HTMLDivElement;
  Args: {
    palettes: LiveQuery;
    showFavorites: boolean;
  };
}

export default class PalettesListComponent extends Component<PalettesListSignature> {
  @service declare store: Store;
  @service declare undoManager: UndoManager;

  get palettes(): PaletteModel[] {
    const palettes = (this.args.palettes?.value ?? []) as PaletteModel[];

    if (this.args.showFavorites) {
      return palettes.filter((palette) => palette.isFavorite);
    }

    return palettes;
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
      const operations: RecordOperationTerm[] = [];

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

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    PalettesList: typeof PalettesListComponent;
  }
}

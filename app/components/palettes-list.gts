import { action } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import type { LiveQuery, Store } from 'ember-orbit';
import svgJar from 'ember-svg-jar/helpers/svg-jar';
import type { RecordOperationTerm } from '@orbit/records';
import AnimatedDragSortList from './animated-drag-sort-list.gts';
import PaletteRow from './palette-row.gts';
import type ColorModel from 'swach/data-models/color';
import type PaletteModel from 'swach/data-models/palette';
import type UndoManager from 'swach/services/undo-manager';

interface PalettesListSignature {
  Element: HTMLDivElement;
  Args: {
    palettes: LiveQuery;
    moveColorsBetweenPalettes: ({
      sourceArgs,
      sourceList,
      sourceIndex,
      targetArgs,
      targetList,
      targetIndex,
    }: {
      sourceArgs: { isColorHistory: boolean; parent: PaletteModel };
      sourceList: ColorModel[];
      sourceIndex: number;
      targetArgs: { isColorHistory: boolean; parent: PaletteModel };
      targetList: ColorModel[];
      targetIndex: number;
    }) => Promise<void>;
    showFavorites: boolean;
  };
}

export default class PalettesListComponent extends Component<PalettesListSignature> {
  <template>
    <div class="palettes-list mt-48 overflow-visible" ...attributes>
      {{#if this.palettes.length}}
        <AnimatedDragSortList
          class="overflow-visible"
          @group="palettes"
          @items={{this.palettes}}
          @dragEndAction={{this.reorderPalettes}}
          as |palette|
        >
          {{! TODO: remove this disconnected check when caching is fixed in ember-orbit }}
          {{#unless palette.$isDisconnected}}
            <PaletteRow
              @moveColorsBetweenPalettes={{@moveColorsBetweenPalettes}}
              @palette={{palette}}
            />
          {{/unless}}
        </AnimatedDragSortList>
      {{else}}
        {{#if @showFavorites}}
          <div
            class="flex flex-col justify-center items-center mt-1 p-2 w-full"
          >
            <div class="mb-2">
              {{svgJar "alert-circle" height="50" width="50"}}
            </div>

            <h3 class="font-bold m-1 text-xl">
              No Favorites
            </h3>

            <p class="font-light mt-1">
              You can favorite a palette by clicking the
              {{svgJar "filled-heart" class="inline" height="14" width="14"}}
              icon in the palette's menu.
            </p>
          </div>
        {{/if}}
      {{/if}}
    </div>
  </template>
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
    targetIndex,
  }: {
    sourceList: PaletteModel[];
    sourceIndex: number;
    targetList: PaletteModel[];
    targetIndex: number;
  }): Promise<void> {
    if (sourceList === targetList && sourceIndex === targetIndex) return;

    const movedItem = sourceList[sourceIndex] as PaletteModel;

    sourceList.splice(sourceIndex, 1);
    targetList.splice(targetIndex, 0, movedItem);

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

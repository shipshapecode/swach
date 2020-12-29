import Controller, { inject as controller } from '@ember/controller';
import { action } from '@ember/object';
import Router from '@ember/routing/router-service';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

import { Store } from 'ember-orbit';

import { OperationTerm } from '@orbit/data/src/operation-term';
import { clone } from '@orbit/utils';

import ApplicationController from 'swach/controllers/application';
import ColorModel from 'swach/data-models/color';
import PaletteModel from 'swach/data-models/palette';
import ColorUtils from 'swach/services/color-utils';
import UndoManager from 'swach/services/undo-manager';

export default class PalettesController extends Controller {
  @controller application!: ApplicationController;
  @service colorUtils!: ColorUtils;
  @service router!: Router;
  @service store!: Store;
  @service undoManager!: UndoManager;

  @tracked showFavorites = false;

  get modelArray(): PaletteModel[] {
    return this.model.value;
  }

  get colorHistory(): PaletteModel | undefined {
    return this.modelArray.findBy('isColorHistory', true);
  }

  get last16Colors(): ColorModel[] {
    const colors = this.colorHistory?.colors ?? [];
    return colors.sortBy('createdAt').reverse().slice(0, 16);
  }

  get palettes(): PaletteModel[] {
    let palettes = this.modelArray || [];

    if (this.showFavorites) {
      palettes = palettes.filterBy('isFavorite', true);
    }

    return palettes.filterBy('isColorHistory', false);
  }

  @action
  async createNewPalette(): Promise<void> {
    await this.store.addRecord({
      type: 'palette',
      name: 'Palette',
      createdAt: new Date(),
      colorOrder: [],
      isColorHistory: false,
      isFavorite: false,
      isLocked: false
    });

    this.undoManager.setupUndoRedo();
  }

  @action
  disableMovingColors({
    draggedItem,
    items
  }: {
    draggedItem: ColorModel;
    items: ColorModel[];
  }): number {
    return items.indexOf(draggedItem);
  }

  @action
  async moveColorsBetweenPalettes({
    sourceArgs,
    sourceList,
    sourceIndex,
    targetArgs,
    targetList,
    targetIndex
  }: {
    sourceArgs: { isColorHistory: boolean; parent: PaletteModel };
    sourceList: ColorModel[];
    sourceIndex: number;
    targetArgs: { isColorHistory: boolean; parent: PaletteModel };
    targetList: ColorModel[];
    targetIndex: number;
  }): Promise<void> {
    // If the same list and same index, we are not moving anywhere, so return
    if (sourceList === targetList && sourceIndex === targetIndex) return;

    const sourceParent = sourceArgs.parent;
    const targetParent = targetArgs.parent;

    // If the palette is locked, we should not allow dragging colors into or out of it
    if (
      (sourceParent && sourceParent.isLocked) ||
      (targetParent && targetParent.isLocked)
    )
      return;

    const item = sourceList.objectAt(sourceIndex);

    if (item) {
      // Dragging color out of color history
      if (sourceArgs.isColorHistory) {
        await this._moveColorFromColorHistory(
          item,
          sourceList,
          targetList,
          targetIndex,
          targetParent
        );
      } else {
        const sourceColor = sourceList.objectAt(sourceIndex);

        if (sourceColor) {
          const sourceColorList = sourceList.map((color: ColorModel) => {
            return { type: 'color', id: color.id };
          });

          const colorToRemove = sourceColorList.findBy('id', sourceColor.id);

          if (colorToRemove) {
            sourceColorList.removeObject(colorToRemove);

            await this.store.update((t) => {
              const operations: OperationTerm[] = [];

              operations.push(
                t.removeFromRelatedRecords(
                  { type: 'palette', id: sourceParent.id },
                  'colors',
                  { type: 'color', id: sourceColor.id }
                )
              );

              operations.push(
                t.replaceAttribute(
                  { type: 'palette', id: sourceParent.id },
                  'colorOrder',
                  sourceColorList
                )
              );

              if (!targetArgs.isColorHistory) {
                this._moveColorFromPaletteToPalette(
                  item,
                  operations,
                  t,
                  sourceList,
                  targetList,
                  targetIndex,
                  targetParent
                );
              }

              return operations;
            });
          }
        }
      }

      this.undoManager.setupUndoRedo();
    }
  }

  /**
   * Called when dragging a color from color history to another palette.
   */
  @action
  async _moveColorFromColorHistory(
    item: ColorModel,
    sourceList: ColorModel[],
    targetList: ColorModel[],
    targetIndex: number,
    targetParent: PaletteModel
  ): Promise<void> {
    if (sourceList !== targetList) {
      const colorsList = targetList.map((color) => {
        return { type: 'color', id: color.id };
      });

      const existingColor = targetList.findBy('hex', item.hex);
      if (existingColor) {
        const colorToRemove = colorsList.findBy('id', existingColor.id);
        if (colorToRemove) {
          colorsList.removeObject(colorToRemove);
        }
      }

      const colorCopy = clone(item.getData());
      colorCopy.createdAt = new Date();
      // We need to delete the id and relationships from the copy, so the new copy
      // is not associated with the old color or palette.
      delete colorCopy.id;
      delete colorCopy.relationships;

      await this.store.update((t) => {
        const addColorToPaletteOperation = t.addRecord(colorCopy);

        colorsList.insertAt(targetIndex, {
          type: 'color',
          id: addColorToPaletteOperation.operation.record.id
        });

        const operations: OperationTerm[] = [addColorToPaletteOperation];

        operations.push(
          t.replaceAttribute(
            { type: 'palette', id: targetParent.id },
            'colorOrder',
            colorsList
          )
        );

        operations.push(
          t.replaceRelatedRecords(
            { type: 'palette', id: targetParent.id },
            'colors',
            colorsList
          )
        );

        return operations;
      });
    }
  }

  /**
   * Called when dragging a color from a palette to another palette
   */
  @action
  async _moveColorFromPaletteToPalette(
    item: ColorModel,
    operations: unknown[],
    t: Store['transformBuilder'],
    sourceList: ColorModel[],
    targetList: ColorModel[],
    targetIndex: number,
    targetParent: PaletteModel
  ): Promise<void> {
    let insertIndex = targetIndex;
    const targetColorsList = targetList.map((color: ColorModel) => {
      return { type: 'color', id: color.id };
    });

    const existingColor = targetList.findBy('hex', item.hex);

    if (existingColor) {
      const colorToRemove = targetColorsList.findBy('id', existingColor.id);

      if (colorToRemove) {
        // We do not want to modify insertIndex if we are moving a color within the same palette
        if (sourceList !== targetList) {
          const existingColorIndex = targetColorsList.indexOf(colorToRemove);
          // If this color already exists in the palette at a lower index, we need to decrease the index,
          // so we are not inserting out of bounds
          if (existingColorIndex < targetIndex) {
            insertIndex--;
          }
        }
        targetColorsList.removeObject(colorToRemove);
      }

      t.removeFromRelatedRecords(
        { type: 'palette', id: targetParent.id },
        'colors',
        { type: 'color', id: existingColor.id }
      );
    }

    targetColorsList.insertAt(insertIndex, {
      type: 'color',
      id: item.id
    });

    operations.push(
      t.replaceAttribute(
        { type: 'palette', id: targetParent.id },
        'colorOrder',
        targetColorsList
      )
    );

    operations.push(
      t.addToRelatedRecords(
        { type: 'palette', id: targetParent.id },
        'colors',
        { type: 'color', id: item.id }
      )
    );
  }

  @action
  transitionToColorHistory(event: InputEvent): void {
    event.stopPropagation();
    if (this.colorHistory) {
      this.router.transitionTo('colors', {
        queryParams: { paletteId: this.colorHistory.id }
      });
    }
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your controllers.
declare module '@ember/controller' {
  interface Registry {
    palettes: PalettesController;
  }
}

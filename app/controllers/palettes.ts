import Controller, { inject as controller } from '@ember/controller';
import { action } from '@ember/object';
import Router from '@ember/routing/router-service';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

import { Store } from 'ember-orbit';

import { RecordOperationTerm } from '@orbit/records';

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

  get colorHistory(): PaletteModel {
    return this.model.colorHistory.value[0];
  }

  get last16Colors(): ColorModel[] {
    const colors = this.colorHistory?.colors ?? [];
    return colors.sortBy('createdAt').reverse().slice(0, 16);
  }

  @action
  async clearColorHistory(): Promise<void> {
    const colorHistoryId = this.colorHistory?.id;
    await this.store.update((t) =>
      t.replaceRelatedRecords(
        { type: 'palette', id: colorHistoryId },
        'colors',
        []
      )
    );
    this.undoManager.setupUndoRedo();
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
      isLocked: false,
      index: 0
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
    const sourcePalette = sourceArgs.parent;
    const targetPalette = targetArgs.parent;

    // If the palette is locked, we should not allow dragging colors into or out of it
    if (sourcePalette?.isLocked || targetPalette?.isLocked) return;

    const sourceColor = sourceList.objectAt(sourceIndex);

    if (sourceColor) {
      if (sourceArgs.isColorHistory) {
        // Drag color out of color history
        await this._moveColorFromColorHistory(
          sourceColor,
          sourceList,
          targetList,
          targetIndex,
          targetPalette
        );
      } else if (sourceList === targetList) {
        // Move color within a single palette
        if (sourceIndex !== targetIndex) {
          await this._moveColorWithinPalette(
            sourceColor,
            sourceList,
            sourcePalette,
            targetIndex
          );
        }
      } else {
        // Move color between palettes
        this._moveColorBetweenPalettes(
          sourceColor,
          sourceList,
          sourcePalette,
          targetList,
          targetIndex,
          targetPalette
        );
      }

      this.undoManager.setupUndoRedo();
    }
  }

  /**
   * Called when dragging a color from color history to another palette.
   */
  async _moveColorFromColorHistory(
    sourceColor: ColorModel,
    sourceList: ColorModel[],
    targetList: ColorModel[],
    targetIndex: number,
    targetParent: PaletteModel
  ): Promise<void> {
    if (sourceList !== targetList) {
      // Clone the attributes of the original color but not its id and
      // relationships, so the new color will not be associated with the
      // original color or palette.
      const data = sourceColor.$getData();
      const attributes = data?.attributes;
      const colorCopy = {
        type: 'color',
        id: this.store.schema.generateId('color'),
        ...attributes,
        createdAt: new Date()
      };
      const colorsList = targetList.map((c) => c.$identity);

      const existingColor = targetList.findBy('hex', sourceColor.hex);
      if (existingColor) {
        const colorToRemove = colorsList.findBy('id', existingColor.id);
        if (colorToRemove) {
          colorsList.removeObject(colorToRemove);
        }
      }

      colorsList.insertAt(targetIndex, {
        type: 'color',
        id: colorCopy.id
      });

      await this.store.update((t) => [
        t.addRecord(colorCopy),
        t.replaceAttribute(
          { type: 'palette', id: targetParent.id },
          'colorOrder',
          colorsList
        ),
        t.replaceRelatedRecords(
          { type: 'palette', id: targetParent.id },
          'colors',
          colorsList
        )
      ]);
    }
  }

  /**
   * Called when dragging a color within a single palette
   */
  async _moveColorWithinPalette(
    sourceColor: ColorModel,
    sourceList: ColorModel[],
    sourcePalette: PaletteModel,
    targetIndex: number
  ): Promise<void> {
    const sourceColorList = sourceList.map((c) => c.$identity);
    const colorToMove = sourceColorList.findBy('id', sourceColor.id);

    if (colorToMove) {
      sourceColorList.removeObject(colorToMove);
      sourceColorList.insertAt(targetIndex, colorToMove);

      await this.store.update((t) =>
        t.replaceAttribute(sourcePalette, 'colorOrder', sourceColorList)
      );
    }
  }

  /**
   * Called when dragging a color from a palette to another palette
   */
  async _moveColorBetweenPalettes(
    sourceColor: ColorModel,
    sourceList: ColorModel[],
    sourcePalette: PaletteModel,
    targetList: ColorModel[],
    targetIndex: number,
    targetPalette: PaletteModel
  ): Promise<void> {
    const sourceColorOrder = sourceList.map((c) => c.$identity);
    const colorToRemove = sourceColorOrder.findBy('id', sourceColor.id);

    if (colorToRemove) {
      sourceColorOrder.removeObject(colorToRemove);

      await this.store.update((t) => {
        const operations: RecordOperationTerm[] = [
          t.removeFromRelatedRecords(sourcePalette, 'colors', sourceColor),
          t.replaceAttribute(sourcePalette, 'colorOrder', sourceColorOrder)
        ];

        if (!targetPalette.isColorHistory) {
          let insertIndex = targetIndex;
          const targetColorOrder = targetList.map((c) => c.$identity);
          const existingColor = targetList.findBy('hex', sourceColor.hex);

          if (existingColor) {
            const colorToRemove = targetColorOrder.findBy(
              'id',
              existingColor.id
            );

            if (colorToRemove) {
              const existingColorIndex =
                targetColorOrder.indexOf(colorToRemove);
              // If this color already exists in the palette at a lower index, we need to decrease the index,
              // so we are not inserting out of bounds
              if (existingColorIndex < targetIndex) {
                insertIndex--;
              }
              targetColorOrder.removeObject(colorToRemove);
            }

            t.removeFromRelatedRecords(targetPalette, 'colors', existingColor);
          }

          targetColorOrder.insertAt(insertIndex, sourceColor.$identity);

          operations.push(
            t.addToRelatedRecords(targetPalette, 'colors', sourceColor)
          );

          operations.push(
            t.replaceAttribute(targetPalette, 'colorOrder', targetColorOrder)
          );
        }

        return operations;
      });
    }
  }

  @action
  transitionToColorHistory(event: InputEvent): void {
    event.stopPropagation();

    if (this.colorHistory.colors.length) {
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

import Controller, { inject as controller } from '@ember/controller';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import filterBy from 'ember-array-utils/utils/filter-by';
import findBy from 'ember-array-utils/utils/find-by';

export default class PalettesController extends Controller {
  @controller application;
  @service colorUtils;
  @service router;
  @service store;
  @service undoManager;

  @tracked showFavorites = false;

  get colorHistory() {
    return findBy(this.model.value, 'isColorHistory', true);
  }

  get last16Colors() {
    const colors = (this.colorHistory && this.colorHistory.colors) || [];
    return colors.sortBy('createdAt').reverse().slice(0, 16);
  }

  get palettes() {
    let palettes = this.model.value || [];

    if (this.showFavorites) {
      palettes = filterBy(palettes, 'isFavorite', true);
    }

    return filterBy(palettes, 'isColorHistory', false);
  }

  @action
  async createNewPalette() {
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
  disableMovingColors({ draggedItem, items }) {
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
  }) {
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

    let item = sourceList.objectAt(sourceIndex);

    // Dragging color out of color history
    if (sourceArgs.isColorHistory) {
      if (sourceList !== targetList) {
        const colorsList = targetList.map((color) => {
          return { type: 'color', id: color.id };
        });

        const existingColor = findBy(targetList, 'hex', item.hex);
        if (existingColor) {
          const colorToRemove = findBy(colorsList, 'id', existingColor.id);
          colorsList.removeObject(colorToRemove);
        }

        colorsList.insertAt(targetIndex, {
          type: 'color',
          id: item.id
        });

        await this.store.update((t) => {
          const operations = [];

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
    } else {
      const sourceColor = sourceList.objectAt(sourceIndex);

      const sourceColorList = sourceList.map((color) => {
        return { type: 'color', id: color.id };
      });

      const colorToRemove = findBy(sourceColorList, 'id', sourceColor.id);

      sourceColorList.removeObject(colorToRemove);

      await this.store.update((t) => {
        const operations = [];

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
          const targetColorsList = targetList.map((color) => {
            return { type: 'color', id: color.id };
          });

          const existingColor = findBy(targetList, 'hex', item.hex);
          if (existingColor) {
            const colorToRemove = findBy(
              targetColorsList,
              'id',
              existingColor.id
            );
            targetColorsList.removeObject(colorToRemove);

            t.removeFromRelatedRecords(
              { type: 'palette', id: targetParent.id },
              'colors',
              { type: 'color', id: existingColor.id }
            );
          }

          targetColorsList.insertAt(targetIndex, {
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

        return operations;
      });
    }

    this.undoManager.setupUndoRedo();
  }

  @action
  transitionToColorHistory(event) {
    event.stopPropagation();
    this.router.transitionTo('colors', {
      queryParams: { paletteId: this.colorHistory.id }
    });
  }
}

import Controller, { inject as controller } from '@ember/controller';
import { action, computed, get } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class PalettesController extends Controller {
  @controller application;
  @service colorUtils;
  @service store;

  @tracked showFavorites = false;

  get last16Colors() {
    const colors =
      (this.model.colorHistory && this.model.colorHistory.colors) || [];
    return colors
      .sortBy('createdAt')
      .reverse()
      .slice(0, 16);
  }

  @computed('model.palettes.[]', 'showFavorites')
  get palettes() {
    let palettes = this.model.palettes || [];

    if (this.showFavorites) {
      palettes = palettes.filterBy('isFavorite', true);
    }

    return palettes.filterBy('isColorHistory', false);
  }

  @action
  async createNewPalette() {
    return await this.store.addRecord({
      type: 'palette',
      name: 'Palette',
      createdAt: new Date(),
      isColorHistory: false,
      isFavorite: false,
      isLocked: false
    });
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

    const sourceParent = get(sourceArgs, 'parent');
    const targetParent = get(targetArgs, 'parent');

    // If the palette is locked, we should not allow dragging colors into or out of it
    if (
      (sourceParent && sourceParent.isLocked) ||
      (targetParent && targetParent.isLocked)
    )
      return;

    let item = sourceList.objectAt(sourceIndex);

    // Dragging color out of color history
    if (get(sourceArgs, 'isColorHistory')) {
      if (sourceList !== targetList) {
        const existingColor = targetList.findBy('hex', item.hex);
        if (existingColor) {
          targetList.removeObject(item);
        }
        targetList.insertAt(targetIndex, item);
        if (targetParent) {
          await targetParent.save();
        }
      }
    } else {
      sourceList.removeAt(sourceIndex);

      if (!get(targetArgs, 'isColorHistory')) {
        const existingColor = targetList.findBy('hex', item.hex);
        if (existingColor) {
          targetList.removeObject(item);
        }
        targetList.insertAt(targetIndex, item);
      }

      if (sourceParent) {
        await sourceParent.save();
      }

      if (targetParent && sourceList !== targetList) {
        await targetParent.save();
      }
    }

    await item.save();
  }
}

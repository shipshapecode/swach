import Controller, { inject as controller } from '@ember/controller';
import { action, computed, get } from '@ember/object';
import { inject as service } from '@ember/service';

export default class PalettesController extends Controller {
  @controller application;
  @service colorUtils;
  @service store;

  @computed('model.colorHistory.colors.[]')
  get last18Colors() {
    const colors =
      (this.model.colorHistory && this.model.colorHistory.colors) || [];
    return colors
      .sortBy('createdAt')
      .reverse()
      .slice(0, 18);
  }

  @computed('model.palettes.[]', 'application.showFavorites')
  get palettes() {
    let palettes = this.model.palettes || [];

    if (this.application.showFavorites) {
      palettes = palettes.filterBy('isFavorite', true);
    }

    return palettes
      .filterBy('isColorHistory', false)
      .sortBy('createdAt')
      .reverse();
  }

  @action
  createNewPalette() {
    this.store.createRecord('palette', { name: 'Palette' });
  }

  @action
  disableMovingColors({ draggedItem, items }) {
    return items.indexOf(draggedItem);
  }

  @action
  moveColorsBetweenPalettes({
    sourceArgs,
    sourceList,
    sourceIndex,
    targetArgs,
    targetList,
    targetIndex
  }) {
    if (sourceList === targetList && sourceIndex === targetIndex) return;

    const sourceParent = get(sourceArgs, 'parent');
    const targetParent = get(targetArgs, 'parent');
    let item = sourceList.objectAt(sourceIndex);

    // Dragging color out of color history
    if (get(sourceArgs, 'isColorHistory')) {
      item = { ...item };
      if (sourceList !== targetList) {
        targetList.insertAt(targetIndex, item);
        if (targetParent) {
          targetParent.save();
        }
      }
    } else {
      sourceList.removeAt(sourceIndex);

      if (!get(targetArgs, 'isColorHistory')) {
        targetList.insertAt(targetIndex, item);
      }

      if (sourceParent) {
        sourceParent.save();
      }

      if (targetParent && sourceList !== targetList) {
        targetParent.save();
      }
    }
  }
}

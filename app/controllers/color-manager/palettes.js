import Controller from '@ember/controller';
import { action, computed, get } from '@ember/object';
import { inject as service } from '@ember/service';

export default class ColorManagerPalettesController extends Controller {
  @service store;

  @computed('model.colorHistory.colors.[]')
  get last15Colors() {
    const colors = this.model.colorHistory && this.model.colorHistory.colors || [];
    return colors
      .sortBy('createdAt')
      .reverse()
      .slice(0, 14);
  }

  @computed('model.palettes.[]')
  get palettes() {
    const palettes = this.model.palettes || [];
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

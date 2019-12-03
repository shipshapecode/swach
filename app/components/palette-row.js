import Component from '@ember/component';
import { action, set } from '@ember/object';
import { inject as service } from '@ember/service';
import ContextMenuMixin from 'ember-context-menu';

export default class PaletteRowComponent extends Component.extend(
  ContextMenuMixin
) {
  @service colorUtils;
  @service dragSort;

  isEditing = false;

  contextItems = [
    {
      icon: 'font',
      label: 'Rename Palette',
      action: this.toggleIsEditing
    },
    {
      icon: 'trash',
      label: 'Delete Palette',
      action: this.deletePalette
    }
  ];

  init() {
    super.init();

    this.dragSort.on('start', ({ draggedItem }) => {
      document.documentElement.style.setProperty(
        '--dragged-swatch-color',
        draggedItem.hex
      );
    });
  }

  @action
  addColorToPalette(color, ops) {
    const palette = ops.target.palette;
    palette.colors.pushObject(color);
    palette.save();
  }

  @action
  deletePalette() {
    this.palette.destroyRecord();
  }

  @action
  insertedNameInput(element) {
    element.focus();
  }

  @action
  toggleIsEditing() {
    set(this, 'isEditing', !this.isEditing);
  }

  @action
  updateColorOrder({
    sourceArgs,
    sourceList,
    sourceIndex,
    targetArgs,
    targetList,
    targetIndex
  }) {
    if (sourceList === targetList && sourceIndex === targetIndex) return;

    const item = sourceList.objectAt(sourceIndex);

    sourceList.removeAt(sourceIndex);
    targetList.insertAt(targetIndex, item);
    sourceArgs.parent.save();
    if (sourceArgs.parent.id !== targetArgs.parent.id) {
      targetArgs.parent.save();
    }
  }

  @action
  updatePaletteName(palette) {
    palette.save();
    set(this, 'isEditing', false);
  }
}

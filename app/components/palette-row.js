import Component from '@ember/component';
import { action, set } from '@ember/object';
import { inject as service } from '@ember/service';
import ContextMenuMixin from 'ember-context-menu';

export default class PaletteRowComponent extends Component.extend(
  ContextMenuMixin
) {
  @service colorUtils;

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
  updateColorOrder({ sourceList, sourceIndex, targetList, targetIndex }) {
    if (sourceList === targetList && sourceIndex === targetIndex) return;

    const item = sourceList.objectAt(sourceIndex);

    sourceList.removeAt(sourceIndex);
    targetList.insertAt(targetIndex, item);
    sourceList.invoke('save');
    targetList.invoke('save');
  }

  @action
  updatePaletteName(palette) {
    palette.save();
    set(this, 'isEditing', false);
  }
}

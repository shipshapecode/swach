import { action } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { orbit, type Store } from 'ember-orbit';
import type TransitionContext from 'ember-animated/-private/transition-context';
import AnimatedContainer from 'ember-animated/components/animated-container';
import AnimatedEach from 'ember-animated/components/animated-each';
import { easeOut } from 'ember-animated/easings/cosine';
import move from 'ember-animated/motions/move';
import { fadeOut } from 'ember-animated/motions/opacity';
import type { RecordOperationTerm } from '@orbit/records';
import ColorRow from './color-row.gts';
import type { SelectedColorModel } from './rgb-input';
import type ColorModel from 'swach/data-models/color';
import type PaletteModel from 'swach/data-models/palette';
import type UndoManager from 'swach/services/undo-manager';

interface ColorsListSignature {
  Args: {
    palette: PaletteModel;
    toggleColorPickerIsShown: (color?: SelectedColorModel) => void;
  };
}

export default class ColorsListComponent extends Component<ColorsListSignature> {
  <template>
    <AnimatedContainer class="colors-list">
      {{#AnimatedEach
        this.sortedColors duration=400 use=this.transition
        as |color|
      }}
        {{! TODO: remove this disconnected check when caching is fixed in ember-orbit }}
        {{#unless color.$isDisconnected}}
          <ColorRow
            @color={{color}}
            @deleteColor={{this.deleteColor}}
            @palette={{@palette}}
            @toggleColorPickerIsShown={{@toggleColorPickerIsShown}}
          />
        {{/unless}}
      {{/AnimatedEach}}
    </AnimatedContainer>
  </template>

  @orbit declare store: Store;
  @service declare undoManager: UndoManager;

  get sortedColors(): Array<SelectedColorModel> {
    const { palette } = this.args;

    if (!palette.$isDisconnected) {
      if (palette.isColorHistory) {
        return [...palette.colors].sort((a, b) => {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }) as Array<SelectedColorModel>;
      } else {
        return palette.colorOrder.map((color: { type: string; id: string }) => {
          return palette.colors.find((c) => c.id === color.id) as ColorModel;
        }) as Array<SelectedColorModel>;
      }
    }

    return [];
  }

  // eslint-disable-next-line require-yield
  *transition({
    keptSprites,
    insertedSprites,
    removedSprites,
  }: TransitionContext) {
    for (const sprite of insertedSprites) {
      if (sprite.finalBounds?.height) {
        sprite.startTranslatedBy(0, -sprite.finalBounds.height / 2);
      }

      move(sprite, { easing: easeOut });
    }

    for (const sprite of keptSprites) {
      move(sprite, { easing: easeOut });
    }

    for (const sprite of removedSprites) {
      fadeOut(sprite, { easing: easeOut });
    }
  }

  @action
  async deleteColor(color: ColorModel) {
    const { palette } = this.args;

    if (color && palette && !palette.isLocked) {
      const colorsList = palette.colors.map((color) => {
        return { type: 'color', id: color.id };
      });

      const colorToRemove = colorsList.find((c) => c.id === color.id);

      if (colorToRemove) {
        colorsList.splice(colorsList.indexOf(colorToRemove), 1);

        await this.store.update((t) => {
          const operations: RecordOperationTerm[] = [
            t.removeFromRelatedRecords(
              { type: 'palette', id: palette.id },
              'colors',
              { type: 'color', id: colorToRemove.id }
            ),
            t.replaceAttribute(
              { type: 'palette', id: palette.id },
              'colorOrder',
              colorsList
            ),
            t.removeRecord(colorToRemove),
          ];

          return operations;
        });

        this.undoManager.setupUndoRedo();
      }
    }
  }
}

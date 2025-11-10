import { concat, fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { action } from '@ember/object';
import type Router from '@ember/routing/router-service';
import { service } from '@ember/service';
import Component from '@glimmer/component';

import type { Transition } from 'ember-animated/-private/transition';
import AnimatedIf from 'ember-animated/components/animated-if';
import type MotionService from 'ember-animated/services/-ea-motion';
import fade from 'ember-animated/transitions/fade';
import stopPropagation from 'ember-event-helpers/helpers/stop-propagation';
import sub from 'ember-math-helpers/helpers/sub';
import { orbit, type Store } from 'ember-orbit';
import set from 'ember-set-helper/helpers/set';
import svgJar from 'ember-svg-jar/helpers/svg-jar';
import eq from 'ember-truth-helpers/helpers/eq';

import type ColorModel from '../data-models/color.ts';
import type PaletteModel from '../data-models/palette.ts';
import htmlSafe from '../helpers/html-safe.ts';
import type ColorUtils from '../services/color-utils.ts';
import type UndoManager from '../services/undo-manager.ts';

interface KulerPaletteRowSignature {
  Args: {
    palette: PaletteModel;
    setSelectedIroColor: (index: number) => void;
  };
}

export default class KulerPaletteRowComponent extends Component<KulerPaletteRowSignature> {
  <template>
    <div
      data-test-kuler-palette="{{@palette.name}}"
      class="cursor-default mb-3 w-full"
    >
      <div
        class="flex items-center justify-between h-6 pb-2 text-main-text w-full"
      >
        <h6 class="text-sm" data-test-kuler-palette-name>
          {{@palette.name}}
        </h6>

        <div
          data-test-kuler-palette-menu
          {{on "mouseenter" (set this "showMenu" true)}}
          {{on "mouseleave" (set this "showMenu" false)}}
        >
          {{#AnimatedIf this.showMenu use=this.fade}}
            <div>
              <button
                type="button"
                data-test-save-kuler-palette
                {{on "click" this.savePalette}}
              >
                {{svgJar "save" class="stroke-icon" height="14" width="14"}}
              </button>
            </div>
          {{else}}
            <div>
              {{svgJar "more-horizontal" class="icon" height="15" width="15"}}
            </div>
          {{/AnimatedIf}}
        </div>
      </div>

      <div class="palette flex grow h-8 relative w-full">
        <div class="absolute palette-color-squares flex grow h-8 top-0 w-full">
          {{#each @palette.colors as |color index|}}
            <div
              class="flex grow relative
                {{if (eq index 0) 'rounded-l'}}
                {{if (eq index (sub @palette.colors.length 1)) 'rounded-r'}}"
            >
              <div
                data-test-kuler-palette-color="{{index}}"
                class="absolute h-full left-0 top-0 w-full z-10
                  {{if (eq index 0) 'rounded-l'}}
                  {{if (eq index (sub @palette.colors.length 1)) 'rounded-r'}}
                  {{if
                    (eq index @palette.selectedColorIndex)
                    'selected-color'
                  }}"
                style={{htmlSafe (concat "background-color: " color.hex)}}
                {{on
                  "click"
                  (stopPropagation (fn this.setSelectedColor color))
                }}
              ></div>
              <div
                class="opacity-checkerboard absolute h-full left-0 top-0 w-full z-0
                  {{if (eq index 0) 'rounded-l'}}
                  {{if (eq index (sub @palette.colors.length 1)) 'rounded-r'}}"
              ></div>
            </div>
          {{/each}}
        </div>
      </div>
    </div>
  </template>

  @orbit declare store: Store;

  @service declare colorUtils: ColorUtils;
  @service('-ea-motion') declare eaMotion: MotionService;
  @service declare router: Router;
  @service declare undoManager: UndoManager;

  fade = fade as Transition;
  showMenu = false;

  /**
   * Sets the selected color, and selects the palette if not already selected.
   * @param {Color} color The color to select
   * @param {Palette} palette The palette to select
   */
  @action
  setSelectedColor(color: ColorModel): void {
    const selectedColorIndex = this.args.palette.colors.indexOf(color);

    this.args.setSelectedIroColor(selectedColorIndex);
    this.args.palette.selectedColorIndex = selectedColorIndex;
  }

  @action
  async savePalette(): Promise<void> {
    this.router.transitionTo('palettes');

    const { palette } = this.args;
    const { colors } = palette;

    const newColors = colors.map((color) => {
      const { createdAt, hex, name, r, g, b, a } = color;

      return {
        type: 'color',
        id: this.store.schema.generateId('color'),
        createdAt,
        hex,
        name,
        r,
        g,
        b,
        a,
      };
    });

    const colorsList = newColors.map((color) => {
      return { type: 'color', id: color.id };
    });

    const newPalette = {
      type: 'palette',
      id: this.store.schema.generateId('palette'),
      name: this.args.palette.name,
      colors: colorsList,
      colorOrder: colorsList,
      createdAt: new Date(),
      index: 0,
      isColorHistory: false,
      isFavorite: false,
      isLocked: false,
    };

    await this.eaMotion.waitUntilIdle.perform();

    await this.store.update((t) => [
      ...newColors.map((c) => t.addRecord(c)),
      t.addRecord(newPalette),
    ]);

    this.undoManager.setupUndoRedo();
  }
}

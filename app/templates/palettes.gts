import type { TemplateOnlyComponent } from '@ember/component/template-only';
import { concat, fn, hash } from '@ember/helper';
import { on } from '@ember/modifier';
import DragSortList from 'ember-drag-sort/components/drag-sort-list';
import stopPropagation from 'ember-event-helpers/helpers/stop-propagation';
import type { LiveQuery } from 'ember-orbit';
import set from 'ember-set-helper/helpers/set';
import svgJar from 'ember-svg-jar/helpers/svg-jar';
import not from 'ember-truth-helpers/helpers/not';
import OptionsMenu from '../components/options-menu.gts';
import PalettesList from '../components/palettes-list.gts';
import htmlSafe from '../helpers/html-safe.ts';
import type PalettesController from 'swach/controllers/palettes';

export default <template>
  <div
    class="color-history-container bg-main fixed left-1/2 -translate-x-1/2 z-20"
  >
    <div class="bg-menu flex flex-wrap h-32 p-2 rounded-sm w-full">
      <div
        class="cursor-default flex grow items-center justify-between mb-2 p-1 text-main-text text-sm w-full"
        {{on "click" (stopPropagation @controller.transitionToColorHistory)}}
      >
        <div>
          Color History
        </div>

        {{#if @controller.last16Colors.length}}
          <OptionsMenu data-test-color-history-menu @showBackground={{true}}>
            <:trigger>
              {{svgJar "more-horizontal" class="icon" height="15" width="15"}}
            </:trigger>
            <:content>
              <button
                data-test-clear-color-history
                class="inline-block p-1 text-menu-text transition-colors hover:text-menu-text-hover"
                type="button"
                {{on "click" @controller.clearColorHistory}}
              >
                {{svgJar
                  "clear-history"
                  class="menu-icon inline-block mr-2"
                  height="20"
                  width="20"
                }}
                Clear History
              </button>
            </:content>
          </OptionsMenu>
        {{/if}}
      </div>

      {{#if @controller.last16Colors.length}}
        <DragSortList
          class="color-history-list flex h-20 flex-wrap w-full"
          data-test-color-history
          @additionalArgs={{hash isColorHistory=true}}
          @isHorizontal={{true}}
          @items={{@controller.last16Colors}}
          @sourceOnly={{true}}
          @dragEndAction={{@controller.moveColorsBetweenPalettes}}
          as |color|
        >
          <div
            class="inline-block mx-1 h-8 relative rounded-md w-8"
            {{on
              "click"
              (fn @controller.colorUtils.copyColorToClipboard color)
            }}
          >
            <div
              data-test-color-history-square={{color.name}}
              class="absolute h-8 left-0 rounded-sm top-0 w-8 z-10"
              style={{htmlSafe (concat "background-color: " color.hex)}}
            ></div>
            <div
              class="opacity-checkerboard absolute h-8 left-0 rounded-sm top-0 w-8 z-0"
            ></div>
          </div>
        </DragSortList>
      {{else}}
        <span class="inline-block m-1 py-1 text-main-text text-sm w-full">
          Use the
          <span class="font-bold">
            eyedropper
          </span>
          {{svgJar "drop" class="menu-icon inline" height="12" width="12"}}
          or
          <span class="font-bold">
            color selector
          </span>
          {{svgJar
            "edit-color"
            class="menu-icon inline"
            height="12"
            width="12"
          }}
          to start building your palette.
        </span>
      {{/if}}
    </div>

    <div class="flex items-center justify-between mt-4 p-1 pt-2 w-full">
      <h2 class="pl-1 text-lg text-heading">
        Palettes
      </h2>

      <div>
        <button
          type="button"
          {{on
            "click"
            (set @controller "showFavorites" (not @controller.showFavorites))
          }}
        >
          {{svgJar
            (if @controller.showFavorites "filled-heart" "outline-heart")
            class=(concat "icon " (if @controller.showFavorites "filled"))
            height="18"
            width="18"
          }}
        </button>

        <button
          data-test-create-palette
          class="ml-1 mt-1 text-sm hover:text-alt-hover"
          type="button"
          {{on "click" @controller.createNewPalette}}
        >
          {{svgJar "plus-circle" class="icon" height="18" width="18"}}
        </button>
      </div>
    </div>
  </div>

  <PalettesList
    @moveColorsBetweenPalettes={{@controller.moveColorsBetweenPalettes}}
    @palettes={{@model}}
    @showFavorites={{@controller.showFavorites}}
  />
</template> satisfies TemplateOnlyComponent<{
  Args: { model: LiveQuery; controller: PalettesController };
}>;

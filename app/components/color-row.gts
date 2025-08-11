import { concat, fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { action } from '@ember/object';
import type Router from '@ember/routing/router-service';
import { service } from '@ember/service';
import { isEmpty } from '@ember/utils';
import Component from '@glimmer/component';

import stopPropagation from 'ember-event-helpers/helpers/stop-propagation';
import svgJar from 'ember-svg-jar/helpers/svg-jar';

import htmlSafe from '../helpers/html-safe.ts';
import OptionsMenu from './options-menu.ts';
import type ColorModel from 'swach/data-models/color';
import type PaletteModel from 'swach/data-models/palette';
import type ColorUtils from 'swach/services/color-utils';

interface ColorRowSignature {
  Element: HTMLDivElement;
  Args: {
    color: ColorModel;
    deleteColor?: (color: ColorModel) => void;
    palette: PaletteModel;
    showActions?: boolean;
    toggleColorPickerIsShown: (color?: ColorModel) => void;
  };
}

export default class ColorRowComponent extends Component<ColorRowSignature> {
  <template>
    <div
      class="bg-menu cursor-default flex mb-3 p-3 rounded w-full"
      data-test-color={{@color.name}}
      {{on "click" (fn this.colorUtils.copyColorToClipboard @color)}}
    >
      <div class="inline-block m-1 h-14 relative rounded w-14">
        <div
          class="absolute h-14 left-0 rounded top-0 w-14 z-10"
          style={{htmlSafe (concat "background-color: " @color.hex)}}
        ></div>
        <div
          class="opacity-checkerboard absolute h-14 left-0 rounded top-0 w-14 z-0"
        ></div>
      </div>

      <div class="flex grow justify-between items-center">
        <div class="flex flex-col justify-center">
          <p
            class="font-medium pl-2 text-main-text text-sm"
            data-test-color-name
          >
            {{@color.name}}
          </p>
          <p
            class="font-medium pl-2 pt-2 text-sub-text text-xs"
            data-test-color-hex
          >
            {{@color.hex}}
          </p>
        </div>

        {{#if this.showActions}}
          <OptionsMenu
            data-test-color-row-menu
            class="text-sm"
            @showBackground={{true}}
          >
            <:trigger>
              {{svgJar "more-horizontal" class="icon" height="15" width="15"}}
            </:trigger>
            <:content>
              <button
                data-test-edit-color
                class="flex items-center p-1 text-menu-text transition-colors hover:text-menu-text-hover"
                type="button"
                {{on "click" (fn @toggleColorPickerIsShown @color)}}
              >
                {{svgJar "edit" class="icon mr-4" height="15" width="15"}}
                Edit Color
              </button>
              <button
                data-test-go-to-kuler
                class="flex items-center p-1 text-menu-text transition-colors hover:text-menu-text-hover"
                type="button"
                {{on "click" this.transitionToKuler}}
              >
                {{svgJar
                  "color-harmonies"
                  class="icon mr-4"
                  height="15"
                  width="15"
                }}
                Color Harmonies
              </button>
              {{#if @deleteColor}}
                <button
                  data-test-delete-color
                  class="flex items-center p-1 text-menu-text transition-colors hover:text-menu-text-hover"
                  disabled={{@palette.isLocked}}
                  type="button"
                  {{on "click" (stopPropagation (fn this.deleteColor @color))}}
                >
                  {{svgJar "trash" class="icon mr-4" height="15" width="15"}}
                  Delete Color
                </button>
              {{/if}}
            </:content>
          </OptionsMenu>
        {{/if}}
      </div>
    </div>
  </template>
  @service declare colorUtils: ColorUtils;
  @service declare router: Router;

  get showActions() {
    if (isEmpty(this.args.showActions)) {
      return true;
    }

    return this.args.showActions;
  }

  @action
  deleteColor(color: ColorModel): void {
    if (!this.args.palette.isLocked) {
      this.args.deleteColor?.(color);
    }
  }

  @action
  transitionToKuler(event: Event): void {
    event.stopPropagation();
    this.router.transitionTo('kuler', {
      queryParams: { colorId: this.args.color.id },
    });
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    ColorRow: typeof ColorRowComponent;
  }
}

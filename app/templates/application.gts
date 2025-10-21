import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { LinkTo } from '@ember/routing';
// @ts-expect-error TODO: fix this
import AnimatedTools from 'ember-animated-tools/components/animated-tools';
import FlashMessage from 'ember-cli-flash/components/flash-message';
import RouteTemplate from 'ember-route-template';
import setBodyClass from 'ember-set-body-class/helpers/set-body-class';
import svgJar from 'ember-svg-jar/helpers/svg-jar';
import and from 'ember-truth-helpers/helpers/and';
import not from 'ember-truth-helpers/helpers/not';
import ColorPicker from '../components/color-picker.gts';
import OptionsMenu from '../components/options-menu.gts';
import type ApplicationController from 'swach/controllers/application';

export default RouteTemplate<{
  Args: { model: unknown; controller: ApplicationController };
}>(
  <template>
    {{setBodyClass @controller.theme}}

    <AnimatedTools @hideUntilKeys="Ctrl+Alt+A+B+C+D+E+F+G" />

    <main
      class="bg-main flex justify-center h-full text-alt transition-colors duration-500 w-full overflow-hidden"
    >
      <div class="flex flex-col max-w-xl h-full relative w-full">
        <nav
          class="bg-menu flex justify-between items-center p-4 w-full z-50
            {{if @controller.isWelcomeRoute 'hidden'}}"
        >
          <div class="flex grow">
            {{#if (not @controller.colorPickerIsShown)}}
              <OptionsMenu @position="left">
                <:trigger>
                  {{svgJar
                    "menu"
                    class="stroke-menu-icon"
                    height="15"
                    width="15"
                  }}
                </:trigger>
                <:content>
                  <LinkTo
                    class="flex items-center p-1 text-menu-text text-sm transition-colors hover:text-menu-text-hover"
                    @route="palettes"
                  >
                    {{svgJar
                      "palettes"
                      class="menu-icon inline-block mr-2"
                      height="13"
                      width="13"
                    }}
                    Palettes
                  </LinkTo>

                  <LinkTo
                    class="flex items-center p-1 text-menu-text text-sm transition-colors hover:text-menu-text-hover"
                    @route="contrast"
                  >
                    {{svgJar
                      "contrast"
                      class="menu-icon inline-block mr-2"
                      height="13"
                      width="13"
                    }}
                    Check Contrast
                  </LinkTo>

                  <LinkTo
                    class="flex items-center p-1 text-menu-text text-sm transition-colors hover:text-menu-text-hover"
                    @route="settings"
                  >
                    {{svgJar
                      "settings"
                      class="menu-icon inline-block mr-2"
                      height="13"
                      width="13"
                    }}
                    Settings
                  </LinkTo>

                  <button
                    class="flex items-center p-1 text-menu-text text-sm transition-colors hover:text-menu-text-hover"
                    type="button"
                    {{on "click" @controller.exitApp}}
                  >
                    {{svgJar
                      "close"
                      class="menu-icon inline-block mr-2"
                      height="13"
                      width="13"
                    }}
                    Close Swach
                  </button>
                </:content>
              </OptionsMenu>
            {{/if}}
          </div>

          <div class="flex grow items-center justify-end">
            <div class="h-4 w-4 mr-2">
              {{#if
                (and
                  @controller.showEyedropperIcon
                  (not @controller.colorPickerIsShown)
                )
              }}
                <button type="button" {{on "click" @controller.launchPicker}}>
                  {{svgJar "drop" class="menu-icon" height="20" width="20"}}
                </button>
              {{/if}}
            </div>

            <div class="h-4 w-4">
              {{#if @controller.showColorWheel}}
                <ColorPicker
                  @isShown={{@controller.colorPickerIsShown}}
                  @saveColor={{@controller.addColor}}
                  @selectedColor={{@controller.colorPickerColor}}
                  @toggleIsShown={{@controller.toggleColorPickerIsShown}}
                />
                <button
                  data-test-toggle-color-picker
                  type="button"
                  {{on
                    "click"
                    (fn @controller.toggleColorPickerIsShown undefined)
                  }}
                >
                  {{svgJar "edit-color" height="20" width="20"}}
                </button>
              {{/if}}
            </div>
          </div>
        </nav>

        <div class="flex-1 overflow-auto px-2 py-4">
          {{outlet}}
        </div>
        <div class="bottom-0 h-auto fixed flex flex-col p-3 w-full">
          {{#each @controller.flashMessages.queue as |flash|}}
            <FlashMessage @flash={{flash}} />
          {{/each}}
        </div>
      </div>
    </main>
  </template>
);

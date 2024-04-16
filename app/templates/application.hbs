{{set-body-class this.theme}}

<AnimatedTools @hideUntilKeys="Ctrl+Alt+A+B+C+D+E+F+G" />

<main
  class="bg-main flex justify-center h-full text-alt transition-colors duration-500 w-full overflow-hidden"
>
  <div class="flex flex-col max-w-xl h-full relative w-full">
    <nav
      class="bg-menu flex justify-between items-center p-4 w-full z-50
        {{if this.isWelcomeRoute 'hidden'}}"
    >
      <div class="grow">
        {{#if (not this.colorPickerIsShown)}}
          <OptionsMenu @position="left">
            <:trigger>
              {{svg-jar "menu" class="stroke-menu-icon" height="15" width="15"}}
            </:trigger>
            <:content>
              <LinkTo
                class="flex items-center p-1 text-menu-text text-sm transition-colors hover:text-menu-text-hover"
                @route="palettes"
              >
                {{svg-jar
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
                {{svg-jar
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
                {{svg-jar
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
                {{on "click" this.exitApp}}
              >
                {{svg-jar
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
          {{#if (and this.showEyedropperIcon (not this.colorPickerIsShown))}}
            <button type="button" {{on "click" this.launchPicker}}>
              {{svg-jar "drop" class="menu-icon" height="20" width="20"}}
            </button>
          {{/if}}
        </div>

        <div class="h-4 w-4">
          {{#if this.showColorWheel}}
            <ColorPicker
              @isShown={{this.colorPickerIsShown}}
              @saveColor={{this.addColor}}
              @selectedColor={{this.colorPickerColor}}
              @toggleIsShown={{this.toggleColorPickerIsShown}}
            />
            <button
              data-test-toggle-color-picker
              type="button"
              {{on "click" this.toggleColorPickerIsShown}}
            >
              {{svg-jar "edit-color" height="20" width="20"}}
            </button>
          {{/if}}
        </div>
      </div>
    </nav>

    <div class="flex-1 overflow-auto p-3">
      {{outlet}}
    </div>
    <div class="bottom-0 h-auto fixed flex flex-col p-3 w-full">
      {{#each this.flashMessages.queue as |flash|}}
        {{!@glint-expect-error FlashMessage component is not typed}}
        <FlashMessage @flash={{flash}} />
      {{/each}}
    </div>
  </div>
</main>
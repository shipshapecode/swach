<div
  data-test-kuler-palette="{{@palette.name}}"
  class="cursor-default mb-3 w-full"
>
  <div class="flex items-center justify-between h-6 pb-2 text-main-text w-full">
    <h6 class="text-sm" data-test-kuler-palette-name>
      {{@palette.name}}
    </h6>

    <div
      data-test-kuler-palette-menu
      {{on "mouseenter" (set this "showMenu" true)}}
      {{on "mouseleave" (set this "showMenu" false)}}
    >
      {{#animated-if this.showMenu use=this.fade}}
        <div>
          <button
            type="button"
            data-test-save-kuler-palette
            {{on "click" this.savePalette}}
          >
            {{svg-jar "save" class="stroke-icon" height="14" width="14"}}
          </button>
        </div>
      {{else}}
        <div>
          {{svg-jar "more-horizontal" class="icon" height="15" width="15"}}
        </div>
      {{/animated-if}}
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
              {{if (eq index @palette.selectedColorIndex) 'selected-color'}}"
            style={{html-safe (concat "background-color: " color.hex)}}
            {{on "click" (stop-propagation (fn this.setSelectedColor color))}}
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
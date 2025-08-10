<div class="p-4 h-full">
  <h6 class="font-semibold mb-2 text-heading text-sm">
    Formats
  </h6>

  <p class="text-sm">
    This determines the default color format that gets copied to the clipboard.
  </p>

  <OptionsMenu
    data-test-settings-format-dropdown
    class="my-4 w-full"
    @optionsClasses="divide-y divide-alt !p-0 w-full"
    @triggerClasses="bg-menu font-medium inline-flex justify-between px-4 py-2 rounded-md text-sm text-menu-text w-full focus:outline-none"
  >
    <:trigger>
      {{this.settings.defaultColorFormat}}

      <div class="bg-btn-bg-secondary p-1 rounded-full">
        {{svg-jar "chevron-left" class="h-3 w-3 -rotate-90"}}
      </div>
    </:trigger>
    <:content>
      {{#each this.colorFormats as |format|}}
        <button
          data-test-format-option={{format}}
          class="px-4 py-2 text-left text-sm transition-colors w-full hover:text-menu-text-hover"
          type="button"
          {{on "click" (set this "settings.defaultColorFormat" format)}}
        >
          {{format}}
        </button>
      {{/each}}
    </:content>
  </OptionsMenu>

  <div class="mb-16">
    <h6 class="font-semibold mb-2 mt-4 text-heading text-sm">
      Data management
    </h6>

    <LoadingButton
      data-test-export-swatches-button
      class="mb-2"
      @loading={{this.isExporting}}
      @onClick={{this.exportIndexedDB}}
    >
      Backup swatches
    </LoadingButton>

    <LoadingButton
      data-test-import-swatches-button
      @loading={{this.isImporting}}
      @onClick={{this.importIndexedDB}}
    >
      Restore from backup
    </LoadingButton>
  </div>
</div>
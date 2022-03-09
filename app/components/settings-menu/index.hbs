{{! template-lint-disable builtin-component-arguments }}
<div
  class="font-normal p-4 text-main-text text-sm w-full"
  data-test-settings-menu
>
  <div class="pb-2">
    {{#if this.isMacOSOrWindows}}
      <label class="flex items-center mb-1">
        <Input
          data-test-settings-startup
          class="form-checkbox h-4 mr-2 text-checkbox rounded w-4"
          @type="checkbox"
          @checked={{this.settings.openOnStartup}}
          {{on "change" @enableDisableAutoStart}}
        />

        Start Swach on system startup
      </label>
    {{/if}}

    {{#if this.isMacOS}}
      <label class="flex items-center mb-1">
        <Input
          data-test-settings-show-dock-icon
          class="form-checkbox h-4 mr-2 text-checkbox rounded w-4"
          @type="checkbox"
          @checked={{this.settings.showDockIcon}}
          {{on "change" @toggleShowDockIcon}}
        />

        Show dock icon
      </label>
    {{/if}}

    <label class="flex items-center mb-1">
      <Input
        data-test-settings-sounds
        class="form-checkbox h-4 mr-2 text-checkbox rounded w-4"
        @type="checkbox"
        @checked={{this.settings.sounds}}
      />

      Play sounds
    </label>

    <label class="flex items-center mb-1">
      <Input
        class="form-checkbox h-4 mr-2 text-checkbox rounded w-4"
        @type="checkbox"
        @checked={{this.settings.notifications}}
      />

      Show notifications
    </label>
  </div>

  <div class="pb-4" data-test-settings-select-theme>
    <h6 class="font-semibold mb-2 mt-4 text-heading text-sm">
      Appearance
    </h6>

    <div class="grid grid-cols-3 gap-2">
      {{#each this.themes as |theme|}}
        {{#let (eq this.settings.userTheme theme) as |checked|}}
          <label>
            <input
              data-test-settings-select-theme={{theme}}
              class="image-radio absolute h-0 opacity-0 w-0"
              checked={{checked}}
              name="theme"
              type="radio"
              value="dynamic"
              {{on "change" (fn this.changeTheme theme)}}
            />

            {{svg-jar (concat theme "-theme")}}

            <div class="mt-1 text-center w-full {{if checked 'font-bold'}}">
              {{capitalize theme}}
            </div>
          </label>
        {{/let}}
      {{/each}}
    </div>
  </div>

  <About />

  {{#if this.isMacOSOrWindows}}
    <div class="py-6">
      <div class="flex h-8 w-full">
        <LoadingButton
          @loading={{this.checkingForUpdates}}
          @onClick={{@checkForUpdates}}
        >
          Check for updates
        </LoadingButton>
      </div>
    </div>
  {{/if}}
</div>
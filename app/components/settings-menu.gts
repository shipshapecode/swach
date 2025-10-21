import { Input } from '@ember/component';
import { concat, fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { action } from '@ember/object';
import type Owner from '@ember/owner';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { storageFor } from 'ember-local-storage';
import svgJar from 'ember-svg-jar/helpers/svg-jar';
import eq from 'ember-truth-helpers/helpers/eq';
import capitalize from '../helpers/capitalize.ts';
import About from './about.gts';
import LoadingButton from './loading-button.gts';
import type { SettingsStorage, themes } from 'swach/storages/settings';

interface SettingsMenuSignature {
  Element: HTMLDivElement;
  Args: {
    checkForUpdates: () => void;
    enableDisableAutoStart: (event: Event) => void;
    toggleShowDockIcon: (event: Event) => void;
  };
}

export default class SettingsMenu extends Component<SettingsMenuSignature> {
  <template>
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
              class="form-checkbox h-4 mr-2 text-checkbox rounded-sm w-4"
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
              class="form-checkbox h-4 mr-2 text-checkbox rounded-sm w-4"
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
            class="form-checkbox h-4 mr-2 text-checkbox rounded-sm w-4"
            @type="checkbox"
            @checked={{this.settings.sounds}}
          />

          Play sounds
        </label>

        <label class="flex items-center mb-1">
          <Input
            class="form-checkbox h-4 mr-2 text-checkbox rounded-sm w-4"
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

                {{svgJar (concat theme "-theme")}}

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
  </template>
  @storageFor('settings') settings!: SettingsStorage;

  declare ipcRenderer: Window['electronAPI']['ipcRenderer'];
  themes = ['light', 'dark', 'dynamic'] as const;

  @tracked platform?: string;

  constructor(owner: Owner, args: SettingsMenuSignature['Args']) {
    super(owner, args);

    if (typeof window !== 'undefined' && window.electronAPI) {
      const { ipcRenderer } = window.electronAPI;

      this.ipcRenderer = ipcRenderer;

      void this.ipcRenderer.invoke('getPlatform').then((platform: string) => {
        this.platform = platform;
      });
    }
  }

  get checkingForUpdates() {
    return false;
  }

  get isMacOS() {
    return this.platform === 'darwin';
  }

  get isMacOSOrWindows() {
    return this.platform === 'darwin' || this.platform === 'win32';
  }

  @action
  changeTheme(theme: themes): void {
    this.settings.set('userTheme', theme);
  }
}

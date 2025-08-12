import { on } from '@ember/modifier';
import type Owner from '@ember/owner';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import onClickOutside from 'ember-click-outside/modifiers/on-click-outside';
import cssTransition from 'ember-css-transitions/modifiers/css-transition';
// @ts-expect-error TODO: fix this
import stopPropagation from 'ember-event-helpers/helpers/stop-propagation';
import set from 'ember-set-helper/helpers/set';
import and from 'ember-truth-helpers/helpers/and';
import not from 'ember-truth-helpers/helpers/not';

interface OptionsMenuSignature {
  Element: HTMLDivElement;
  Args: {
    optionsClasses?: string;
    position?: 'left' | 'right';
    showBackground?: boolean;
    triggerClasses?: string;
  };
  Blocks: { content: []; trigger: [] };
}

export default class OptionsMenu extends Component<OptionsMenuSignature> {
  <template>
    <div class="relative inline-block text-left" ...attributes>
      <button
        data-test-options-trigger
        class="px-1 rounded transition-colors
          {{if (and this.isShown @showBackground) 'bg-main'}}
          {{@triggerClasses}}"
        type="button"
        {{on "click" (stopPropagation (set this "isShown" (not this.isShown)))}}
        {{onClickOutside
          (set this "isShown" false)
          eventType="mousedown"
          exceptSelector=".options-menu *"
        }}
      >
        {{yield to="trigger"}}
      </button>

      {{#if this.isShown}}
        <div
          data-test-options-content
          class="options-menu absolute bg-menu mt-2 p-3 origin-top-{{this.position}}
            {{this.position}}-0 ring-1 ring-main rounded-md shadow-lg text-menu-text w-44 z-50
            {{@optionsClasses}}"
          {{cssTransition
            enterClass="opacity-0 scale-95"
            enterActiveClass="transition ease-out duration-100"
            enterToClass="opacity-100 scale-100"
            leaveClass="opacity-100 scale-100"
            leaveActiveClass="transition ease-in duration-75"
            leaveToClass="opacity-0 scale-95"
          }}
          {{on "click" (stopPropagation (set this "isShown" false))}}
        >
          {{yield to="content"}}
        </div>
      {{/if}}
    </div>
  </template>
  @tracked position: 'left' | 'right' = 'right';
  @tracked isShown = false;

  constructor(owner: Owner, args: OptionsMenuSignature['Args']) {
    super(owner, args);

    this.position = this.args.position ?? 'right';
  }
}

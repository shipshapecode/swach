import { on } from '@ember/modifier';
import type { TOC } from '@ember/component/template-only';

interface ToggleSwitchSignature {
  Element: HTMLButtonElement;
  Args: { checked: boolean; onClick: () => unknown };
}

export const ToggleSwitch: TOC<ToggleSwitchSignature> = <template>
  <div class="flex items-center">
    <span class="mr-3">
      <span class="text-sm font-medium text-main-text">
        Off
      </span>
    </span>

    <button
      aria-pressed="{{@checked}}"
      class="relative inline-flex shrink-0 h-8 w-16 border-2 border-transparent rounded-full transition-colors ease-in-out duration-200 focus:outline-none
        {{if @checked 'bg-green-400' 'bg-gray-200'}}"
      type="button"
      {{on "click" @onClick}}
      ...attributes
    >
      <span
        class="translate-x-0 relative inline-block h-7 w-7 rounded-full bg-white shadow ring-0 transition ease-in-out duration-200
          {{if @checked 'translate-x-8' 'translate-x-0'}}"
      >
        <span
          class="absolute inset-0 h-full w-full flex items-center justify-center transition-opacity
            {{if
              @checked
              'opacity-0 ease-out duration-100'
              'opacity-100 ease-in duration-200'
            }}"
          aria-hidden="true"
        >
          <svg class="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
            <path
              d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
        </span>

        <span
          class="opacity-0 ease-out duration-100 absolute inset-0 h-full w-full flex items-center justify-center transition-opacity
            {{if
              @checked
              'opacity-100 ease-in duration-200'
              'opacity-0 ease-out duration-100'
            }}"
          aria-hidden="true"
        >
          <svg
            class="h-3 w-3 text-green-400"
            fill="currentColor"
            viewBox="0 0 12 12"
          >
            <path
              d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z"
            ></path>
          </svg>
        </span>
      </span>
    </button>

    <span class="ml-3">
      <span class="text-sm font-medium text-main-text">
        On
      </span>
    </span>
  </div>
</template>;

export default ToggleSwitch;

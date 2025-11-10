import type { TemplateOnlyComponent } from '@ember/component/template-only';
import { LinkTo } from '@ember/routing';

import set from 'ember-set-helper/helpers/set';
import svgJar from 'ember-svg-jar/helpers/svg-jar';
import not from 'ember-truth-helpers/helpers/not';

import ToggleSwitch from '../../components/toggle-switch.gts';
import type WelcomeAutoStartController from '../../controllers/welcome/auto-start.ts';

export default <template>
  <div class="flex h-full items-center justify-center p-4 w-full">
    <div class="flex flex-col h-full w-full">
      <div class="flex justify-center w-full">
        {{svgJar "swach" class=" h-36 mb-8 w-36"}}
      </div>

      <h2 class="font-semibold mb-2 text-alt text-xl">
        Start Swach Automatically
      </h2>

      <div class="flex-auto mb-2 mt-2 text-main-text">
        <p class="text-sm">
          Would you like Swach to start every time you start your computer?
        </p>

        <div class="flex h-full justify-center p-2 w-full">
          <ToggleSwitch
            data-test-auto-start-toggle
            @checked={{@controller.settings.openOnStartup}}
            @onClick={{set
              @controller.settings
              "openOnStartup"
              (not @controller.settings.openOnStartup)
            }}
          />
        </div>
      </div>

      <div class="flex justify-between mt-8 w-full">
        <LinkTo
          class="btn btn-secondary flex-1 mr-1 p-2 text-center text-sm"
          @route="welcome.index"
        >
          Previous
        </LinkTo>

        <LinkTo
          data-test-link-dock-icon
          class="btn btn-primary flex-1 ml-1 p-2 text-center text-sm"
          @route="welcome.dock-icon"
        >
          Next
        </LinkTo>
      </div>
    </div>
  </div>
</template> satisfies TemplateOnlyComponent<{
  Args: { model: unknown; controller: WelcomeAutoStartController };
}>;

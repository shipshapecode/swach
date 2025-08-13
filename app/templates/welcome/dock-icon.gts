import { LinkTo } from '@ember/routing';
import RouteTemplate from 'ember-route-template';
import set from 'ember-set-helper/helpers/set';
import svgJar from 'ember-svg-jar/helpers/svg-jar';
import not from 'ember-truth-helpers/helpers/not';
import ToggleSwitch from '../../components/toggle-switch.ts';
import type WelcomeDockIconController from 'swach/controllers/welcome/dock-icon';

export default RouteTemplate<{
  Args: { model: unknown; controller: WelcomeDockIconController };
}>(
  <template>
    <div class="flex h-full items-center justify-center p-4 w-full">
      <div class="flex flex-col h-full w-full">
        <div class="flex justify-center w-full">
          {{svgJar "show-dock-icon" class="h-auto mb-8 w-full"}}
        </div>

        <h2 class="font-semibold mb-2 text-alt text-xl">
          Show Dock Icon
        </h2>

        <div class="flex-auto grow mb-2 mt-2 text-main-text">
          <p class="text-sm">
            Swach lives in your menubar and hides the dock icon by default. This
            setting allows you to show the dock icon, and can be useful if the
            menubar icon is not showing up.
          </p>

          <div class="flex h-full justify-center p-2 w-full">
            <ToggleSwitch
              data-test-show-dock-icon-toggle
              @checked={{@controller.settings.showDockIcon}}
              @onClick={{set
                @controller.settings
                "showDockIcon"
                (not @controller.settings.showDockIcon)
              }}
            />
          </div>
        </div>

        <div class="flex justify-between mt-8 w-full">
          <LinkTo
            class="btn btn-secondary flex-1 mr-1 p-2 text-center text-sm"
            @route="welcome.auto-start"
          >
            Previous
          </LinkTo>

          <LinkTo
            class="btn btn-primary flex-1 ml-1 p-2 text-center text-sm"
            @route="welcome.cloud-sync"
          >
            Next
          </LinkTo>
        </div>
      </div>
    </div>
  </template>,
);

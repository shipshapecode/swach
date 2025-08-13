import { on } from '@ember/modifier';
import RouteTemplate from 'ember-route-template';
import svgJar from 'ember-svg-jar/helpers/svg-jar';
import SettingsNav from '../components/settings-nav.ts';
import type SettingsController from 'swach/controllers/settings';

export default RouteTemplate<{
  Args: { model: unknown; controller: SettingsController };
}>(
  <template>
    <button
      class="flex grow items-center mb-1 pb-2 pt-2 text-alt transition-colors w-full hover:text-alt-hover"
      type="button"
      {{on "click" @controller.goBack}}
    >
      {{svgJar "arrow-left" class="stroke-icon mr-2" height="15" width="15"}}
      <span class="font-bold text-sm uppercase">
        Back
      </span>
    </button>

    <SettingsNav />

    <div class="text-main-text w-full">
      {{outlet}}
    </div>
  </template>,
);

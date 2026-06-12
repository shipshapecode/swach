import type { TemplateOnlyComponent } from '@ember/component/template-only';
import { on } from '@ember/modifier';

import SettingsNav from '../components/settings-nav.gts';
import type SettingsController from '../controllers/settings.ts';
import ArrowLeft from '../icons/arrow-left.svg?unsafe-inline';

export default <template>
  <button
    class="flex grow items-center mb-1 pb-2 pt-2 text-alt transition-colors w-full hover:text-alt-hover"
    type="button"
    {{on "click" @controller.goBack}}
  >
    <ArrowLeft class="stroke-icon mr-2" height="15" width="15" />
    <span class="font-bold text-sm uppercase">
      Back
    </span>
  </button>

  <SettingsNav />

  <div class="text-main-text w-full">
    {{outlet}}
  </div>
</template> satisfies TemplateOnlyComponent<{
  Args: { model: unknown; controller: SettingsController };
}>;

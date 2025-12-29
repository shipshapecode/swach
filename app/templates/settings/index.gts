import type { TemplateOnlyComponent } from '@ember/component/template-only';

import SettingsMenu from '../../components/settings-menu.gts';
import type SettingsIndexController from '../../controllers/settings/index.ts';

export default <template>
  <SettingsMenu
    @checkForUpdates={{@controller.application.checkForUpdates}}
    @enableDisableAutoStart={{@controller.application.enableDisableAutoStart}}
    @toggleShowDockIcon={{@controller.application.toggleShowDockIcon}}
  />
</template> satisfies TemplateOnlyComponent<{
  Args: { model: unknown; controller: SettingsIndexController };
}>;

import type { TemplateOnlyComponent } from '@ember/component/template-only';

import SettingsData from '../../components/settings-data.gts';

export default <template>
  <SettingsData />
</template> satisfies TemplateOnlyComponent<{
  Args: { model: unknown; controller: unknown };
}>;

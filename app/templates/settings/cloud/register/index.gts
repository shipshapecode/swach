import type { TemplateOnlyComponent } from '@ember/component/template-only';

import Register from '../../../../components/register.gts';

export default <template>
  <Register />
</template> satisfies TemplateOnlyComponent<{
  Args: { model: unknown; controller: unknown };
}>;

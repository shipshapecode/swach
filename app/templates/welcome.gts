import type { TemplateOnlyComponent } from '@ember/component/template-only';

import type WelcomeController from '../controllers/welcome.ts';

export default <template>{{outlet}}</template> satisfies TemplateOnlyComponent<{
  Args: { model: unknown; controller: WelcomeController };
}>;

import type { TemplateOnlyComponent } from '@ember/component/template-only';
import type WelcomeController from 'swach/controllers/welcome';

export default <template>{{outlet}}</template> satisfies TemplateOnlyComponent<{
  Args: { model: unknown; controller: WelcomeController };
}>;

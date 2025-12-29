import type { TemplateOnlyComponent } from '@ember/component/template-only';

import Login from '../../../components/login.gts';

export default <template><Login /></template> satisfies TemplateOnlyComponent<{
  Args: { model: unknown; controller: unknown };
}>;

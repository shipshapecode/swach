import type { TemplateOnlyComponent } from '@ember/component/template-only';
import ForgotPassword from '../../../components/forgot-password.gts';

export default <template>
  <ForgotPassword />
</template> satisfies TemplateOnlyComponent<{
  Args: { model: unknown; controller: unknown };
}>;

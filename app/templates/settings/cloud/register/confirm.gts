import type { TemplateOnlyComponent } from '@ember/component/template-only';
import RegisterConfirm from '../../../../components/register-confirm.gts';

export default <template>
  <RegisterConfirm />
</template> satisfies TemplateOnlyComponent<{
  Args: { model: unknown; controller: unknown };
}>;

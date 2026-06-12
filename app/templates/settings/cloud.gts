import type { TemplateOnlyComponent } from '@ember/component/template-only';

import Cloud from '../../icons/cloud.svg?unsafe-inline';

export default <template>
  <div class="p-4">
    <Cloud />

    <h6 class="font-semibold mb-2 mt-6 text-heading text-sm">
      Cloud Sync
    </h6>

    <p class="mb-4 text-sm">
      Use cloud sync to keep all your palettes and colors up to date across all
      your devices.
    </p>
  </div>

  {{outlet}}
</template> satisfies TemplateOnlyComponent<{
  Args: { model: unknown; controller: unknown };
}>;

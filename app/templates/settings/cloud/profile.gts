import type { TemplateOnlyComponent } from '@ember/component/template-only';

import LoadingButton from '../../../components/loading-button.gts';
import type SettingsCloudProfileController from '../../../controllers/settings/cloud/profile.ts';

export default <template>
  <div class="bg-menu p-4 rounded-sm w-full">
    <div class="pt-4 w-full">
      <h2 class="font-bold mb-6 text-2xl">
        Signed in as...
      </h2>

      {{#if @model.email}}
        <div
          data-test-profile-detail="email"
          class="border-input-border border-t border-b py-5 text-menu-text text-sm"
        >
          {{@model.email}}
        </div>
      {{/if}}
    </div>

    <div class="mt-6">
      <LoadingButton
        data-test-logout-submit
        class="btn btn-primary w-full"
        @loading={{@controller.loading}}
        @onClick={{@controller.logOut}}
      >
        Sign Out
      </LoadingButton>
    </div>
  </div>
</template> satisfies TemplateOnlyComponent<{
  Args: {
    model: { email?: string; userId?: string };
    controller: SettingsCloudProfileController;
  };
}>;

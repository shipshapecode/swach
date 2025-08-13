import RouteTemplate from 'ember-route-template';
import SettingsMenu from '../../components/settings-menu.ts';
import type SettingsIndexController from 'swach/controllers/settings/index';

export default RouteTemplate<{
  Args: { model: unknown; controller: SettingsIndexController };
}>(
  <template>
    <SettingsMenu
      @checkForUpdates={{@controller.application.checkForUpdates}}
      @enableDisableAutoStart={{@controller.application.enableDisableAutoStart}}
      @toggleShowDockIcon={{@controller.application.toggleShowDockIcon}}
    />
  </template>,
);

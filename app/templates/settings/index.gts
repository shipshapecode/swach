import RouteTemplate from 'ember-route-template';

import SettingsMenu from '../../components/settings-menu.ts';

export default RouteTemplate<{ Args: { model: unknown; controller: unknown } }>(
  <template>
    <SettingsMenu
      @checkForUpdates={{@controller.application.checkForUpdates}}
      @enableDisableAutoStart={{@controller.application.enableDisableAutoStart}}
      @toggleShowDockIcon={{@controller.application.toggleShowDockIcon}}
    />
  </template>,
);

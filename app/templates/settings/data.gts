import RouteTemplate from 'ember-route-template';

import SettingsData from '../../components/settings-data.ts';

export default RouteTemplate<{ Args: { model: unknown; controller: unknown } }>(
  <template><SettingsData /></template>,
);

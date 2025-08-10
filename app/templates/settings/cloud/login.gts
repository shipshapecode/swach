import RouteTemplate from 'ember-route-template';

import Login from '../../../components/login.ts';

export default RouteTemplate<{ Args: { model: unknown; controller: unknown } }>(
  <template><Login /></template>,
);

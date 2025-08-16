import RouteTemplate from 'ember-route-template';
import Register from '../../../../components/register.gts';

export default RouteTemplate<{ Args: { model: unknown; controller: unknown } }>(
  <template><Register /></template>
);

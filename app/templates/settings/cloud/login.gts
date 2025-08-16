import RouteTemplate from 'ember-route-template';
import Login from '../../../components/login.gts';

export default RouteTemplate<{ Args: { model: unknown; controller: unknown } }>(
  <template><Login /></template>,
);

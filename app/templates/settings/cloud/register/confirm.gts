import RouteTemplate from 'ember-route-template';
import RegisterConfirm from '../../../../components/register-confirm.ts';

export default RouteTemplate<{ Args: { model: unknown; controller: unknown } }>(
  <template><RegisterConfirm /></template>,
);

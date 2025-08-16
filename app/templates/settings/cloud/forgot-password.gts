import RouteTemplate from 'ember-route-template';
import ForgotPassword from '../../../components/forgot-password.gts';

export default RouteTemplate<{ Args: { model: unknown; controller: unknown } }>(
  <template><ForgotPassword /></template>,
);

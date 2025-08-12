import RouteTemplate from 'ember-route-template';
import ForgotPassword from '../../../components/forgot-password.ts';

export default RouteTemplate<{ Args: { model: unknown; controller: unknown } }>(
  <template><ForgotPassword /></template>,
);

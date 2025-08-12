import RouteTemplate from 'ember-route-template';
import type WelcomeController from 'swach/controllers/welcome';

export default RouteTemplate<{
  Args: { model: unknown; controller: WelcomeController };
}>(<template>{{outlet}}</template>);

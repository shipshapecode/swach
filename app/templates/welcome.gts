import RouteTemplate from 'ember-route-template'

export default RouteTemplate<{ Args: { model: unknown, controller: unknown } }>(<template>{{outlet}}</template>)
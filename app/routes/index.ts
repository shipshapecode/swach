import Route from '@ember/routing/route';
import { service } from '@ember/service';

import type Router from '@ember/routing/router-service';

export default class IndexRoute extends Route {
  @service declare router: Router;

  beforeModel(): void {
    this.router.replaceWith('palettes');
  }
}

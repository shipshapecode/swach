import Route from '@ember/routing/route';
import Router from '@ember/routing/router-service';
import { service } from '@ember/service';

export default class IndexRoute extends Route {
  @service declare router: Router;

  beforeModel(): void {
    this.router.replaceWith('palettes');
  }
}

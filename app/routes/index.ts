import Route from '@ember/routing/route';
import Router from '@ember/routing/router-service';
import { inject as service } from '@ember/service';

export default class IndexRoute extends Route {
  @service router!: Router;

  beforeModel(): void {
    this.router.replaceWith('palettes');
  }
}

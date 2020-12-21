import Controller from '@ember/controller';
import { action } from '@ember/object';

export default class KulerController extends Controller {
  queryParams = ['colorId'];

  colorId = null;

  @action
  goBack() {
    window.history.back();
  }
}

import Controller from '@ember/controller';
import { action } from '@ember/object';

export default class ContrastController extends Controller {
  @action
  goBack() {
    window.history.back();
  }
}

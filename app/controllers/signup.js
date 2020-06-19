import Controller from '@ember/controller';
import { action } from '@ember/object';

export default class SignupController extends Controller {
  @action
  createNewUser() {
    console.log(this.model);
  }
}

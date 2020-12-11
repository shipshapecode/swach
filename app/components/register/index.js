import Component from '@glimmer/component';
import { action, set } from '@ember/object';
import { inject as service } from '@ember/service';

export default class Register extends Component {
  @service cognito;
  @service router;

  @action
  async register(e) {
    const { username, password } = this;
    const attributes = {
      email: username
    };

    e.preventDefault();
    try {
      await this.cognito.signUp(username, password, attributes);

      this.router.transitionTo('register.confirm');
    } catch (err) {
      set(this, 'errorMessage', err.message);
    }
  }
}

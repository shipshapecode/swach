import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class Register extends Component {
  @service cognito;
  @service router;

  @tracked errorMessage = null;

  @action
  async register() {
    const { username, password } = this;
    const attributes = {
      email: username
    };

    try {
      await this.cognito.signUp(username, password, attributes);

      this.router.transitionTo('settings.cloud.register.confirm');
    } catch (err) {
      this.errorMessage = err?.message;
    }
  }
}

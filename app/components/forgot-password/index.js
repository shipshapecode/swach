import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action, set } from '@ember/object';

export default class ForgotPasswordIndex extends Component {
  @service cognito;
  @service router;

  @action
  async forgotPassword(e) {
    const username = this.username;
    e.preventDefault();

    try {
      await this.cognito.forgotPassword(username);

      this.router.transitionTo('forgot-password.confirm');
    } catch (err) {
      set(this, 'errorMessage', err.message);
    }
  }
}

import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ForgotPasswordIndex extends Component {
  @service cognito;
  @service router;

  @tracked errorMessage = null;

  @action
  async forgotPassword() {
    const username = this.username;

    try {
      await this.cognito.forgotPassword(username);

      this.router.transitionTo('settings.cloud.forgot-password.confirm');
    } catch (err) {
      this.errorMessage = err.message;
    }
  }
}

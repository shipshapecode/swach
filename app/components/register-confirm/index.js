import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class RegisterConfirm extends Component {
  @service cognito;
  @service router;

  @tracked errorMessage = null;

  @action
  async confirm() {
    const { username, code } = this;

    try {
      await this.cognito.confirmSignUp(username, code);

      this.router.transitionTo('settings.cloud');
    } catch (err) {
      this.errorMessage = err?.message;
    }
  }
}

import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class ForgotPasswordConfirm extends Component {
  @service cognito;
  @service router;
  @service session;

  @tracked errorMessage = null;
  @tracked username = null;

  constructor() {
    super(...arguments);

    if (this.session.username) {
      this.username = this.session.username;
    }
  }

  @action
  async forgotPasswordSubmit() {
    const { username, code, password } = this;

    try {
      await this.cognito.forgotPasswordSubmit(username, code, password);

      this.router.transitionTo('settings.cloud');
    } catch (err) {
      this.errorMessage = err.message;
    }
  }
}

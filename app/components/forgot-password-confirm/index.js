import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { action, set } from '@ember/object';

export default class ForgotPasswordConfirm extends Component {
  @service cognito;
  @service router;
  @service session;

  @tracked username = null;

  constructor() {
    super(...arguments);

    if (this.session.username) {
      this.username = this.session.username;
    }
  }

  @action
  async forgotPasswordSubmit(e) {
    const { username, code, password } = this;

    e.preventDefault();

    try {
      await this.cognito.forgotPasswordSubmit(username, code, password);

      this.router.transitionTo('settings.account');
    } catch (err) {
      set(this, 'errorMessage', err.message);
    }
  }
}

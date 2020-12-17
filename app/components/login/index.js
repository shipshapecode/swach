import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class Login extends Component {
  @service router;
  @service session;

  @tracked errorMessage = null;

  @action
  async authenticate() {
    const { username, password } = this;
    const credentials = { username, password };
    try {
      await this.session.authenticate('authenticator:cognito', credentials);
      this.router.transitionTo('settings.cloud');
    } catch (error) {
      this.errorMessage = error.message || error;
    }
  }
}

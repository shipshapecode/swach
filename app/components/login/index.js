import Component from '@glimmer/component';
import { action, set } from '@ember/object';
import { inject as service } from '@ember/service';

export default class Login extends Component {
  @service router;
  @service session;

  @action
  async authenticate() {
    const { username, password } = this;
    const credentials = { username, password };
    try {
      await this.session.authenticate('authenticator:cognito', credentials);
      this.router.transitionTo('settings.cloud');
    } catch (error) {
      set(this, 'errorMessage', error.message || error);
    }
  }
}

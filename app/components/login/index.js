import Component from '@glimmer/component';
import { action, set } from '@ember/object';
import { inject as service } from '@ember/service';

export default class Login extends Component {
  @service session;

  @action
  async authenticate() {
    const { username, password } = this;
    const credentials = { username, password };
    try {
      await this.session.authenticate('authenticator:cognito', credentials);
    } catch (error) {
      set(this, 'errorMessage', error.message || error);
    }
  }
}

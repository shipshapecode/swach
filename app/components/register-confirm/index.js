import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action, set } from '@ember/object';

export default class RegisterConfirm extends Component {
  @service cognito;
  @service router;

  @action
  async confirm(e) {
    const { username, code } = this;

    e.preventDefault();
    try {
      await this.cognito.confirmSignUp(username, code);

      this.router.transitionTo('settings.account');
    } catch (err) {
      set(this, 'errorMessage', err.message);
    }
  }
}

import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import { readOnly } from '@ember/object/computed';
import classic from 'ember-classic-decorator';

@classic
export default class SettingsAccountRoute extends Route {
  @service cognito;
  @service session;
  @readOnly('cognito.user') cognitoUser;

  async model() {
    if (this.session.isAuthenticated) {
      const cognitoAttrs = await this.cognitoUser.getUserAttributes();
      let attributes = cognitoAttrs.map((attr) => {
        return { name: attr.getName(), value: attr.getValue() };
      });
      return { attributes };
    }
  }
}

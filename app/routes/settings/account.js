import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import { get } from '@ember/object';

export default class SettingsAccountRoute extends Route {
  @service cognito;
  @service session;

  async model() {
    if (this.session.isAuthenticated) {
      // eslint-disable-next-line ember/no-get
      const cognitoAttrs = await get(this, 'cognito.user').getUserAttributes();
      let attributes = cognitoAttrs.map((attr) => {
        return { name: attr.getName(), value: attr.getValue() };
      });
      return { attributes };
    }
  }
}

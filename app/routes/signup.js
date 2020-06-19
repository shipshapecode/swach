import Route from '@ember/routing/route';

export default class SignupRoute extends Route {
  async model() {
    const newUser = await this.store.addRecord({ type: 'user'});

    return newUser;
  }
}

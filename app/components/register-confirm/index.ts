import { action } from '@ember/object';
import Router from '@ember/routing/router-service';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import CognitoService from 'ember-cognito/services/cognito';

import { Coordinator } from '@orbit/coordinator';

export default class RegisterConfirm extends Component {
  @service cognito!: CognitoService;
  @service dataCoordinator!: Coordinator;
  @service router!: Router;

  @tracked errorMessage = null;
  @tracked code?: string;
  @tracked username?: string;

  @action
  async confirm(): Promise<void> {
    const { username, code } = this;

    if (username && code) {
      try {
        await this.cognito.confirmSignUp(username, code);

        await this.dataCoordinator.deactivate();

        const backup = this.dataCoordinator.getSource('backup');
        const remote = this.dataCoordinator.getSource('remote');
        const transform = await backup.pull((q) => q.findRecords());

        await remote.update(transform);
        await this.dataCoordinator.activate();

        this.router.transitionTo('settings.cloud');
      } catch (err) {
        this.errorMessage = err?.message;
      }
    }
  }
}

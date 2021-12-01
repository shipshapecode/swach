import { action } from '@ember/object';
import Router from '@ember/routing/router-service';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import CognitoService from 'ember-cognito/services/cognito';

import { Coordinator } from '@orbit/coordinator';
import IndexedDBSource from '@orbit/indexeddb';
import JSONAPISource from '@orbit/jsonapi';
import { InitializedRecord } from '@orbit/records';

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

        const backup =
          this.dataCoordinator.getSource<IndexedDBSource>('backup');
        const remote = this.dataCoordinator.getSource<JSONAPISource>('remote');
        const records = await backup.query<InitializedRecord[]>((q) =>
          q.findRecords()
        );
        await remote.update((t) => records.map((r) => t.addRecord(r)));
        await this.dataCoordinator.activate();

        this.router.transitionTo('settings.cloud');
      } catch (err) {
        this.errorMessage = err?.message;
      }
    }
  }
}

import { setApplication } from '@ember/test-helpers';
import { start as qunitStart, setupEmberOnerrorValidation } from 'ember-qunit';
import setupSinon from 'ember-sinon-qunit';
import * as QUnit from 'qunit';
import { setup } from 'qunit-dom';
import './helpers/flash-message';
import Application from 'swach/app';
import config from 'swach/config/environment';

export function start() {
  setApplication(Application.create(config.APP));

  setup(QUnit.assert);
  setupSinon();
  setupEmberOnerrorValidation();

  qunitStart();
}

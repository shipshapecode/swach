import { setApplication } from '@ember/test-helpers';
import { setupEmberOnerrorValidation, start } from 'ember-qunit';
import { loadTests } from 'ember-qunit/test-loader';
import setupSinon from 'ember-sinon-qunit';
import * as QUnit from 'qunit';
import { setup } from 'qunit-dom';
import './helpers/flash-message';
import Application from 'swach/app';
import config from 'swach/config/environment';

setApplication(Application.create(config.APP));

setup(QUnit.assert);
setupSinon();
setupEmberOnerrorValidation();
loadTests();
start();

import { setApplication } from '@ember/test-helpers';
import { start } from 'ember-qunit';
import setupSinon from 'ember-sinon-qunit';
import * as QUnit from 'qunit';
import { setup } from 'qunit-dom';

import './helpers/flash-message';
import Application from 'swach/app';
import config from 'swach/config/environment';

setup(QUnit.assert);

setApplication(Application.create(config.APP));

setupSinon();

start();

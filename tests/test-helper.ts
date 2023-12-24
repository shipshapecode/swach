import './helpers/flash-message';

import { setApplication } from '@ember/test-helpers';
import * as QUnit from 'qunit';
import { setup } from 'qunit-dom';
import { start } from 'ember-qunit';

import setupSinon from 'ember-sinon-qunit';
import Application from 'swach/app';
import config from 'swach/config/environment';

setup(QUnit.assert);

setApplication(Application.create(config.APP));

setupSinon();

start();

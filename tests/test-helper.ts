import { setApplication } from '@ember/test-helpers';
import { start } from 'ember-qunit';
import * as QUnit from 'qunit';
import { setup } from 'qunit-dom';

import setupSinon from 'ember-sinon-qunit';

import Application from 'swach/app';
import config from 'swach/config/environment';

import './helpers/flash-message';

setup(QUnit.assert);

setApplication(Application.create(config.APP));

setupSinon();

start();

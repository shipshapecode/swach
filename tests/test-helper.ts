import Application from 'swach/app';
import config from 'swach/config/environment';
import { setApplication } from '@ember/test-helpers';
import { start } from 'ember-qunit';
// We need this import so the types are picked up
import 'qunit-dom';

setApplication(Application.create(config.APP));

start();

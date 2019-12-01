import DS from 'ember-data';
import EmberLocalStorageAdapter from 'ember-local-storage/adapters/local';
import ENV from 'swach/config/environment';

let Adapter = EmberLocalStorageAdapter;

if (ENV.environment === 'test') {
  Adapter = DS.JSONAPIAdapter;
}

export default Adapter;

import DS from 'ember-data';
import EmberLocalStorageSerializer from 'ember-local-storage/serializers/serializer';
import ENV from 'swach/config/environment';

let Serializer = EmberLocalStorageSerializer;

if (ENV.environment === 'test') {
  Serializer = DS.JSONAPISerializer;
}

export default Serializer;

import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | kuler', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:kuler');
    assert.ok(route);
  });
});

import { module, test } from 'qunit';

import removeFromTo from 'swach/utils/remove-from-to';

module('Unit | Utility | removeFromTo', function () {
  test('from: 0, to: 0', function (assert) {
    let array = ['a', 'b', 'c', 'd'];
    const result = removeFromTo(array, 0, 0);
    assert.strictEqual(result, 3);
    assert.deepEqual(array, ['b', 'c', 'd']);
  });

  test('from: 2, to: 0', function (assert) {
    let array = ['a', 'b', 'c', 'd'];
    const result = removeFromTo(array, 2, 0);
    assert.strictEqual(result, 3);
    assert.deepEqual(array, ['a', 'b', 'd']);
  });

  test('from: 0, to: 2', function (assert) {
    let array = ['a', 'b', 'c', 'd'];
    const result = removeFromTo(array, 0, 2);
    assert.strictEqual(result, 1);
    assert.deepEqual(array, ['d']);
  });

  test('from: 1, to: 2', function (assert) {
    let array = ['a', 'b', 'c', 'd'];
    const result = removeFromTo(array, 1, 2);
    assert.strictEqual(result, 2);
    assert.deepEqual(array, ['a', 'd']);
  });

  test('from: -1, to: 2', function (assert) {
    let array = ['a', 'b', 'c', 'd'];
    const result = removeFromTo(array, -1, 2);
    assert.strictEqual(result, 4);
    assert.deepEqual(array, ['a', 'b', 'c', 'd']);
  });

  test('from: 2, to: -2', function (assert) {
    let array = ['a', 'b', 'c', 'd'];
    const result = removeFromTo(array, 2, -2);
    assert.strictEqual(result, 3);
    assert.deepEqual(array, ['a', 'b', 'd']);
  });
});

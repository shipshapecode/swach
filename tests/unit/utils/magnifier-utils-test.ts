import { module, test } from 'qunit';

import {
  adjustSquareSize,
  AVAILABLE_DIAMETERS,
  AVAILABLE_GRID_SIZES,
  calculateOptimalGridSize,
  cursorToImageCoordinates,
  getCenterPixelIndex,
  getNextDiameter,
  MAX_SQUARE_SIZE,
  MIN_SQUARE_SIZE,
} from '../../../electron-app/src/utils/magnifier-utils';

module('Unit | Utility | magnifier-utils', function () {
  module('calculateOptimalGridSize', function () {
    test('returns optimal grid size for exact divisions', function (assert) {
      assert.strictEqual(calculateOptimalGridSize(180, 20), 9);
      assert.strictEqual(calculateOptimalGridSize(140, 20), 7);
      assert.strictEqual(calculateOptimalGridSize(100, 20), 5);
    });

    test('returns closest odd grid size for non-exact divisions', function (assert) {
      assert.strictEqual(calculateOptimalGridSize(180, 18), 9);
      assert.strictEqual(calculateOptimalGridSize(200, 20), 9);
    });

    test('always returns odd numbers', function (assert) {
      const result = calculateOptimalGridSize(180, 19);
      assert.strictEqual(result % 2, 1);
    });

    test('returns a value from AVAILABLE_GRID_SIZES', function (assert) {
      const result = calculateOptimalGridSize(250, 25);
      assert.true(AVAILABLE_GRID_SIZES.includes(result));
    });
  });

  module('getNextDiameter', function () {
    test('increments diameter when delta is positive', function (assert) {
      assert.strictEqual(getNextDiameter(180, 1), 240);
      assert.strictEqual(getNextDiameter(240, 1), 300);
    });

    test('decrements diameter when delta is negative', function (assert) {
      assert.strictEqual(getNextDiameter(240, -1), 180);
      assert.strictEqual(getNextDiameter(180, -1), 120);
    });

    test('clamps at minimum diameter', function (assert) {
      assert.strictEqual(getNextDiameter(120, -1), 120);
      assert.strictEqual(getNextDiameter(120, -5), 120);
    });

    test('clamps at maximum diameter', function (assert) {
      assert.strictEqual(getNextDiameter(420, 1), 420);
      assert.strictEqual(getNextDiameter(420, 5), 420);
    });

    test('handles multi-step increments', function (assert) {
      assert.strictEqual(getNextDiameter(120, 2), 240);
      assert.strictEqual(getNextDiameter(180, 3), 420);
    });
  });

  module('adjustSquareSize', function () {
    test('adjusts square size by delta * step', function (assert) {
      assert.strictEqual(adjustSquareSize(20, 1, 2), 22);
      assert.strictEqual(adjustSquareSize(20, -1, 2), 18);
      assert.strictEqual(adjustSquareSize(20, 2, 2), 24);
    });

    test('clamps at minimum square size', function (assert) {
      assert.strictEqual(
        adjustSquareSize(MIN_SQUARE_SIZE, -1, 2),
        MIN_SQUARE_SIZE
      );
      assert.strictEqual(adjustSquareSize(12, -5, 2), MIN_SQUARE_SIZE);
    });

    test('clamps at maximum square size', function (assert) {
      assert.strictEqual(
        adjustSquareSize(MAX_SQUARE_SIZE, 1, 2),
        MAX_SQUARE_SIZE
      );
      assert.strictEqual(adjustSquareSize(38, 5, 2), MAX_SQUARE_SIZE);
    });

    test('uses default step of 2', function (assert) {
      assert.strictEqual(adjustSquareSize(20, 1), 22);
      assert.strictEqual(adjustSquareSize(20, -1), 18);
    });
  });

  module('getCenterPixelIndex', function () {
    test('returns center index for odd grid sizes', function (assert) {
      assert.strictEqual(getCenterPixelIndex(5), 12);
      assert.strictEqual(getCenterPixelIndex(7), 24);
      assert.strictEqual(getCenterPixelIndex(9), 40);
      assert.strictEqual(getCenterPixelIndex(11), 60);
    });

    test('handles minimum grid size', function (assert) {
      assert.strictEqual(getCenterPixelIndex(5), 12);
    });

    test('handles maximum grid size', function (assert) {
      assert.strictEqual(getCenterPixelIndex(21), 220);
    });
  });

  module('cursorToImageCoordinates', function () {
    test('converts cursor position with 1x scale', function (assert) {
      const result = cursorToImageCoordinates(100, 200, 1);
      assert.strictEqual(result.imageX, 100);
      assert.strictEqual(result.imageY, 200);
    });

    test('converts cursor position with 2x scale (Retina)', function (assert) {
      const result = cursorToImageCoordinates(100, 200, 2);
      assert.strictEqual(result.imageX, 200);
      assert.strictEqual(result.imageY, 400);
    });

    test('rounds to nearest logical pixel', function (assert) {
      const result = cursorToImageCoordinates(100.6, 200.4, 2);
      assert.strictEqual(result.imageX, 202);
      assert.strictEqual(result.imageY, 400);
    });

    test('handles fractional scale factors', function (assert) {
      const result = cursorToImageCoordinates(100, 100, 1.5);
      assert.strictEqual(result.imageX, 150);
      assert.strictEqual(result.imageY, 150);
    });
  });

  module('constants', function () {
    test('AVAILABLE_DIAMETERS is valid', function (assert) {
      assert.true(AVAILABLE_DIAMETERS.length > 0);
      assert.deepEqual(AVAILABLE_DIAMETERS, [120, 180, 240, 300, 360, 420]);
    });

    test('AVAILABLE_GRID_SIZES contains only odd numbers', function (assert) {
      assert.true(AVAILABLE_GRID_SIZES.length > 0);
      AVAILABLE_GRID_SIZES.forEach((size) => {
        assert.strictEqual(size % 2, 1);
      });
    });

    test('square size constraints are valid', function (assert) {
      assert.true(MIN_SQUARE_SIZE < MAX_SQUARE_SIZE);
      assert.true(MIN_SQUARE_SIZE > 0);
    });
  });
});

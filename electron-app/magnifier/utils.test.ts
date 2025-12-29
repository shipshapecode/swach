import { describe, expect, test } from 'vitest';

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
} from './utils';

describe('magnifier-utils', () => {
  describe('calculateOptimalGridSize', () => {
    test('returns optimal grid size for exact divisions', () => {
      expect(calculateOptimalGridSize(180, 20)).toBe(9);
      expect(calculateOptimalGridSize(140, 20)).toBe(7);
      expect(calculateOptimalGridSize(100, 20)).toBe(5);
    });

    test('returns closest odd grid size for non-exact divisions', () => {
      expect(calculateOptimalGridSize(180, 18)).toBe(9);
      expect(calculateOptimalGridSize(200, 20)).toBe(9);
    });

    test('always returns odd numbers', () => {
      const result = calculateOptimalGridSize(180, 19);
      expect(result % 2).toBe(1);
    });

    test('returns a value from AVAILABLE_GRID_SIZES', () => {
      const result = calculateOptimalGridSize(250, 25);
      expect(AVAILABLE_GRID_SIZES.includes(result)).toBe(true);
    });
  });

  describe('getNextDiameter', () => {
    test('increments diameter when delta is positive', () => {
      expect(getNextDiameter(180, 1)).toBe(210);
      expect(getNextDiameter(240, 1)).toBe(270);
    });

    test('decrements diameter when delta is negative', () => {
      expect(getNextDiameter(240, -1)).toBe(210);
      expect(getNextDiameter(180, -1)).toBe(150);
    });

    test('clamps at minimum diameter', () => {
      expect(getNextDiameter(120, -1)).toBe(120);
      expect(getNextDiameter(120, -5)).toBe(120);
    });

    test('clamps at maximum diameter', () => {
      expect(getNextDiameter(420, 1)).toBe(420);
      expect(getNextDiameter(420, 5)).toBe(420);
    });
  });

  describe('adjustSquareSize', () => {
    test('adjusts square size by delta * step', () => {
      expect(adjustSquareSize(20, 1, 2)).toBe(22);
      expect(adjustSquareSize(20, -1, 2)).toBe(18);
      expect(adjustSquareSize(20, 2, 2)).toBe(24);
    });

    test('clamps at minimum square size', () => {
      expect(adjustSquareSize(MIN_SQUARE_SIZE, -1, 2)).toBe(MIN_SQUARE_SIZE);
      expect(adjustSquareSize(12, -5, 2)).toBe(MIN_SQUARE_SIZE);
    });

    test('clamps at maximum square size', () => {
      expect(adjustSquareSize(MAX_SQUARE_SIZE, 1, 2)).toBe(MAX_SQUARE_SIZE);
      expect(adjustSquareSize(38, 5, 2)).toBe(MAX_SQUARE_SIZE);
    });

    test('uses default step of 2', () => {
      expect(adjustSquareSize(20, 1)).toBe(22);
      expect(adjustSquareSize(20, -1)).toBe(18);
    });
  });

  describe('getCenterPixelIndex', () => {
    test('returns center index for odd grid sizes', () => {
      expect(getCenterPixelIndex(5)).toBe(12);
      expect(getCenterPixelIndex(7)).toBe(24);
      expect(getCenterPixelIndex(9)).toBe(40);
      expect(getCenterPixelIndex(11)).toBe(60);
    });

    test('handles minimum grid size', () => {
      expect(getCenterPixelIndex(5)).toBe(12);
    });

    test('handles maximum grid size', () => {
      expect(getCenterPixelIndex(21)).toBe(220);
    });
  });

  describe('cursorToImageCoordinates', () => {
    test('converts cursor position with 1x scale on primary display', () => {
      const result = cursorToImageCoordinates(100, 200, 1, { x: 0, y: 0 });
      expect(result.imageX).toBe(100);
      expect(result.imageY).toBe(200);
    });

    test('converts cursor position with 2x scale (Retina) on primary display', () => {
      const result = cursorToImageCoordinates(100, 200, 2, { x: 0, y: 0 });
      expect(result.imageX).toBe(200);
      expect(result.imageY).toBe(400);
    });

    test('rounds to nearest logical pixel', () => {
      const result = cursorToImageCoordinates(100.6, 200.4, 2, { x: 0, y: 0 });
      expect(result.imageX).toBe(202);
      expect(result.imageY).toBe(400);
    });

    test('handles fractional scale factors', () => {
      const result = cursorToImageCoordinates(100, 100, 1.5, { x: 0, y: 0 });
      expect(result.imageX).toBe(150);
      expect(result.imageY).toBe(150);
    });

    test('handles display bounds offset for secondary display', () => {
      // Cursor at global position 1920, 100 on a secondary display with bounds at x: 1920, y: 0
      const result = cursorToImageCoordinates(1920, 100, 2, { x: 1920, y: 0 });
      expect(result.imageX).toBe(0); // Should be 0 relative to the display
      expect(result.imageY).toBe(200); // 100 * 2 scale factor
    });

    test('handles display bounds offset for vertically stacked displays', () => {
      // Cursor at global position 100, 1080 on a display with bounds at x: 0, y: 1080
      const result = cursorToImageCoordinates(100, 1080, 1, { x: 0, y: 1080 });
      expect(result.imageX).toBe(100);
      expect(result.imageY).toBe(0); // Should be 0 relative to the display
    });
  });

  describe('constants', () => {
    test('AVAILABLE_DIAMETERS is valid', () => {
      expect(AVAILABLE_DIAMETERS.length).toBeGreaterThan(0);
      expect(AVAILABLE_DIAMETERS).toEqual([
        120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420,
      ]);
    });

    test('AVAILABLE_GRID_SIZES contains only odd numbers', () => {
      expect(AVAILABLE_GRID_SIZES.length).toBeGreaterThan(0);
      AVAILABLE_GRID_SIZES.forEach((size: number) => {
        expect(size % 2).toBe(1);
      });
    });

    test('square size constraints are valid', () => {
      expect(MIN_SQUARE_SIZE).toBeLessThan(MAX_SQUARE_SIZE);
      expect(MIN_SQUARE_SIZE).toBeGreaterThan(0);
    });

    test('all diameter/square size combinations produce valid grid sizes', () => {
      // Test all combinations to ensure they work
      const squareSizes = [MIN_SQUARE_SIZE, 20, 30, MAX_SQUARE_SIZE];
      const results: string[] = [];

      AVAILABLE_DIAMETERS.forEach((diameter) => {
        squareSizes.forEach((squareSize) => {
          const gridSize = calculateOptimalGridSize(diameter, squareSize);
          expect(AVAILABLE_GRID_SIZES.includes(gridSize)).toBe(true);
          results.push(`D${diameter}/S${squareSize}=G${gridSize}`);
        });
      });

      // Log for debugging
      console.log('Diameter/Square combinations:', results.join(', '));
    });

    test('max diameter with min square size should give largest grid', () => {
      const maxDiameter = AVAILABLE_DIAMETERS[AVAILABLE_DIAMETERS.length - 1]!;
      const gridSize = calculateOptimalGridSize(maxDiameter, MIN_SQUARE_SIZE);

      // 420 / 10 = 42, closest odd is 21 (max available)
      expect(gridSize).toBe(21);
    });

    test('min diameter with max square size should give smallest grid', () => {
      const minDiameter = AVAILABLE_DIAMETERS[0]!;
      const gridSize = calculateOptimalGridSize(minDiameter, MAX_SQUARE_SIZE);

      // 120 / 40 = 3, closest available is 5 (min available)
      expect(gridSize).toBe(5);
    });
  });
});

import { describe, expect, it } from 'vitest';

import {
  calculatePixelUpdates,
  calculatePixelUpdatesWithMismatch,
  getCenterPixelId,
  getPixelId,
  type ColorData,
} from './pixel-grid-utils';

describe('pixel-grid-utils', () => {
  describe('getPixelId', () => {
    it('should calculate correct pixel IDs for a 3x3 grid', () => {
      expect(getPixelId(0, 0, 3)).toBe('pixel-0');
      expect(getPixelId(0, 1, 3)).toBe('pixel-1');
      expect(getPixelId(0, 2, 3)).toBe('pixel-2');
      expect(getPixelId(1, 0, 3)).toBe('pixel-3');
      expect(getPixelId(1, 1, 3)).toBe('pixel-4'); // center
      expect(getPixelId(2, 2, 3)).toBe('pixel-8');
    });

    it('should calculate correct pixel IDs for a 5x5 grid', () => {
      expect(getPixelId(0, 0, 5)).toBe('pixel-0');
      expect(getPixelId(2, 2, 5)).toBe('pixel-12'); // center
      expect(getPixelId(4, 4, 5)).toBe('pixel-24');
    });
  });

  describe('getCenterPixelId', () => {
    it('should return center pixel ID for odd grid sizes', () => {
      expect(getCenterPixelId(3)).toBe('pixel-4');
      expect(getCenterPixelId(5)).toBe('pixel-12');
      expect(getCenterPixelId(7)).toBe('pixel-24');
      expect(getCenterPixelId(9)).toBe('pixel-40');
      expect(getCenterPixelId(11)).toBe('pixel-60');
    });
  });

  describe('calculatePixelUpdates', () => {
    it('should map a 3x3 data grid correctly', () => {
      const data: ColorData[][] = [
        [
          { hex: '#000000', r: 0, g: 0, b: 0 },
          { hex: '#111111', r: 17, g: 17, b: 17 },
          { hex: '#222222', r: 34, g: 34, b: 34 },
        ],
        [
          { hex: '#333333', r: 51, g: 51, b: 51 },
          { hex: '#444444', r: 68, g: 68, b: 68 },
          { hex: '#555555', r: 85, g: 85, b: 85 },
        ],
        [
          { hex: '#666666', r: 102, g: 102, b: 102 },
          { hex: '#777777', r: 119, g: 119, b: 119 },
          { hex: '#888888', r: 136, g: 136, b: 136 },
        ],
      ];

      const updates = calculatePixelUpdates(data, 3);

      expect(updates).toHaveLength(9);
      expect(updates[0]).toEqual({
        pixelId: 'pixel-0',
        color: { hex: '#000000', r: 0, g: 0, b: 0 },
      });
      expect(updates[4]).toEqual({
        pixelId: 'pixel-4',
        color: { hex: '#444444', r: 68, g: 68, b: 68 },
      });
      expect(updates[8]).toEqual({
        pixelId: 'pixel-8',
        color: { hex: '#888888', r: 136, g: 136, b: 136 },
      });
    });
  });

  describe('calculatePixelUpdatesWithMismatch', () => {
    it('should handle matching sizes by delegating to simple path', () => {
      const data: ColorData[][] = [
        [
          { hex: '#000000', r: 0, g: 0, b: 0 },
          { hex: '#111111', r: 17, g: 17, b: 17 },
        ],
        [
          { hex: '#222222', r: 34, g: 34, b: 34 },
          { hex: '#333333', r: 51, g: 51, b: 51 },
        ],
      ];

      const updates = calculatePixelUpdatesWithMismatch(data, 2, 2);
      expect(updates).toHaveLength(4);
    });

    it('should center 3x3 data in a 5x5 display grid', () => {
      // 3x3 data should be placed at positions [1,1] to [3,3] in a 5x5 grid
      const data: ColorData[][] = [
        [
          { hex: '#000', r: 0, g: 0, b: 0 },
          { hex: '#111', r: 17, g: 17, b: 17 },
          { hex: '#222', r: 34, g: 34, b: 34 },
        ],
        [
          { hex: '#333', r: 51, g: 51, b: 51 },
          { hex: '#444', r: 68, g: 68, b: 68 },
          { hex: '#555', r: 85, g: 85, b: 85 },
        ],
        [
          { hex: '#666', r: 102, g: 102, b: 102 },
          { hex: '#777', r: 119, g: 119, b: 119 },
          { hex: '#888', r: 136, g: 136, b: 136 },
        ],
      ];

      const updates = calculatePixelUpdatesWithMismatch(data, 3, 5);

      // Should have 9 updates (3x3)
      expect(updates).toHaveLength(9);

      // Top-left of data should map to pixel-6 (row 1, col 1 in 5x5 grid)
      const topLeft = updates.find((u) => u.pixelId === 'pixel-6');
      expect(topLeft?.color.hex).toBe('#000');

      // Center of data should map to pixel-12 (row 2, col 2 in 5x5 grid = center)
      const center = updates.find((u) => u.pixelId === 'pixel-12');
      expect(center?.color.hex).toBe('#444');

      // Bottom-right of data should map to pixel-18 (row 3, col 3 in 5x5 grid)
      const bottomRight = updates.find((u) => u.pixelId === 'pixel-18');
      expect(bottomRight?.color.hex).toBe('#888');
    });

    it('should use center portion of 5x5 data for a 3x3 display grid', () => {
      // 5x5 data - only center 3x3 portion should be used
      const data: ColorData[][] = [
        [
          { hex: '#00', r: 0, g: 0, b: 0 },
          { hex: '#01', r: 0, g: 1, b: 1 },
          { hex: '#02', r: 0, g: 2, b: 2 },
          { hex: '#03', r: 0, g: 3, b: 3 },
          { hex: '#04', r: 0, g: 4, b: 4 },
        ],
        [
          { hex: '#10', r: 1, g: 0, b: 0 },
          { hex: '#11', r: 1, g: 1, b: 1 },
          { hex: '#12', r: 1, g: 2, b: 2 },
          { hex: '#13', r: 1, g: 3, b: 3 },
          { hex: '#14', r: 1, g: 4, b: 4 },
        ],
        [
          { hex: '#20', r: 2, g: 0, b: 0 },
          { hex: '#21', r: 2, g: 1, b: 1 },
          { hex: '#22', r: 2, g: 2, b: 2 },
          { hex: '#23', r: 2, g: 3, b: 3 },
          { hex: '#24', r: 2, g: 4, b: 4 },
        ],
        [
          { hex: '#30', r: 3, g: 0, b: 0 },
          { hex: '#31', r: 3, g: 1, b: 1 },
          { hex: '#32', r: 3, g: 2, b: 2 },
          { hex: '#33', r: 3, g: 3, b: 3 },
          { hex: '#34', r: 3, g: 4, b: 4 },
        ],
        [
          { hex: '#40', r: 4, g: 0, b: 0 },
          { hex: '#41', r: 4, g: 1, b: 1 },
          { hex: '#42', r: 4, g: 2, b: 2 },
          { hex: '#43', r: 4, g: 3, b: 3 },
          { hex: '#44', r: 4, g: 4, b: 4 },
        ],
      ];

      const updates = calculatePixelUpdatesWithMismatch(data, 5, 3);

      // Should have 9 updates (3x3 display)
      expect(updates).toHaveLength(9);

      // Top-left of display should use data[1][1]
      const topLeft = updates.find((u) => u.pixelId === 'pixel-0');
      expect(topLeft?.color.hex).toBe('#11');

      // Center of display should use data[2][2]
      const center = updates.find((u) => u.pixelId === 'pixel-4');
      expect(center?.color.hex).toBe('#22');

      // Bottom-right of display should use data[3][3]
      const bottomRight = updates.find((u) => u.pixelId === 'pixel-8');
      expect(bottomRight?.color.hex).toBe('#33');
    });

    it('should handle 9x9 data to 11x11 display', () => {
      // Create 9x9 data
      const data: ColorData[][] = Array.from({ length: 9 }, (_, row) =>
        Array.from({ length: 9 }, (_, col) => ({
          hex: `#${row}${col}`,
          r: row * 10,
          g: col * 10,
          b: 0,
        }))
      );

      const updates = calculatePixelUpdatesWithMismatch(data, 9, 11);

      // Should have 81 updates (9x9)
      expect(updates).toHaveLength(81);

      // Top-left of data should map to pixel offset by 1 (11*1 + 1 = 12)
      const topLeft = updates.find((u) => u.pixelId === 'pixel-12');
      expect(topLeft?.color.hex).toBe('#00');

      // Center should map to center of 11x11 (pixel-60)
      const center = updates.find((u) => u.pixelId === 'pixel-60');
      expect(center?.color.hex).toBe('#44');
    });

    it('should handle 11x11 data to 11x11 display (no mismatch)', () => {
      // Create 11x11 data
      const data: ColorData[][] = Array.from({ length: 11 }, (_, row) =>
        Array.from({ length: 11 }, (_, col) => ({
          hex: `#r${row}c${col}`,
          r: row,
          g: col,
          b: 0,
        }))
      );

      const updates = calculatePixelUpdatesWithMismatch(data, 11, 11);

      // Should have 121 updates (11x11)
      expect(updates).toHaveLength(121);

      // Top-left should be pixel-0
      const topLeft = updates.find((u) => u.pixelId === 'pixel-0');
      expect(topLeft?.color.hex).toBe('#r0c0');

      // Center should be pixel-60
      const center = updates.find((u) => u.pixelId === 'pixel-60');
      expect(center?.color.hex).toBe('#r5c5');

      // Bottom-right should be pixel-120
      const bottomRight = updates.find((u) => u.pixelId === 'pixel-120');
      expect(bottomRight?.color.hex).toBe('#r10c10');
    });

    it('should handle 11x11 data to 9x9 display', () => {
      // Create 11x11 data
      const data: ColorData[][] = Array.from({ length: 11 }, (_, row) =>
        Array.from({ length: 11 }, (_, col) => ({
          hex: `#r${row}c${col}`,
          r: row,
          g: col,
          b: 0,
        }))
      );

      const updates = calculatePixelUpdatesWithMismatch(data, 11, 9);

      // Should have 81 updates (9x9 display)
      expect(updates).toHaveLength(81);

      // Top-left of display should use data[1][1] (offset by 1)
      const topLeft = updates.find((u) => u.pixelId === 'pixel-0');
      expect(topLeft?.color.hex).toBe('#r1c1');

      // Center should use data[5][5]
      const center = updates.find((u) => u.pixelId === 'pixel-40');
      expect(center?.color.hex).toBe('#r5c5');

      // Bottom-right should use data[9][9]
      const bottomRight = updates.find((u) => u.pixelId === 'pixel-80');
      expect(bottomRight?.color.hex).toBe('#r9c9');
    });
  });
});

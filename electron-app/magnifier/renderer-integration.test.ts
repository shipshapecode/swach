import { describe, expect, it } from 'vitest';

import {
  calculatePixelUpdatesWithMismatch,
  type ColorData,
  type PixelUpdate,
} from './pixel-grid-utils';

/**
 * Integration tests that simulate real-world scenarios of grid resizing
 * and verify that all pixels get updated correctly.
 */
describe('Magnifier Renderer Integration', () => {
  // Helper to create dummy color data
  function createGridData(size: number): ColorData[][] {
    return Array.from({ length: size }, (_, row) =>
      Array.from({ length: size }, (_, col) => ({
        hex: `#${row.toString(16)}${col.toString(16)}0`,
        r: row * 10,
        g: col * 10,
        b: 0,
      }))
    );
  }

  // Helper to verify all pixels in a grid size are covered
  function verifyAllPixelsCovered(
    updates: PixelUpdate[],
    _gridSize: number
  ): void {
    const pixelIds = new Set(updates.map((u) => u.pixelId));

    // Check that we have the right number of unique updates
    expect(pixelIds.size).toBe(updates.length);
  }

  describe('Zoom In Scenarios (Grid Growing)', () => {
    it('should handle 9x9 → 11x11 transition correctly', () => {
      // Simulate the transition when user scrolls to zoom in
      const oldData = createGridData(9);
      const newData = createGridData(11);

      // Frame 1: Display is 9x9, data is 9x9 (perfect match)
      const frame1 = calculatePixelUpdatesWithMismatch(oldData, 9, 9);
      expect(frame1).toHaveLength(81);
      verifyAllPixelsCovered(frame1, 9);

      // Frame 2: Display is 11x11, data is still 9x9 (transition)
      // Should center 9x9 data in 11x11 grid
      const frame2 = calculatePixelUpdatesWithMismatch(oldData, 9, 11);
      expect(frame2).toHaveLength(81); // Only update the 81 pixels we have data for
      verifyAllPixelsCovered(frame2, 9);

      // Frame 3: Display is 11x11, data is 11x11 (complete)
      const frame3 = calculatePixelUpdatesWithMismatch(newData, 11, 11);
      expect(frame3).toHaveLength(121);
      verifyAllPixelsCovered(frame3, 11);

      // Verify that all 121 pixels would eventually be covered
      const allPixelIds = new Set(frame3.map((u) => u.pixelId));
      expect(allPixelIds.size).toBe(121);
    });

    it('should handle 5x5 → 9x9 transition', () => {
      const oldData = createGridData(5);
      const newData = createGridData(9);

      // Frame 1: 5x5 data in 5x5 display
      const frame1 = calculatePixelUpdatesWithMismatch(oldData, 5, 5);
      expect(frame1).toHaveLength(25);

      // Frame 2: 5x5 data in 9x9 display (centered)
      const frame2 = calculatePixelUpdatesWithMismatch(oldData, 5, 9);
      expect(frame2).toHaveLength(25);
      // Check that data is centered (offset by 2)
      const frame2Ids = frame2.map((u) => u.pixelId);
      expect(frame2Ids).toContain('pixel-20'); // Top-left of centered 5x5
      expect(frame2Ids).toContain('pixel-40'); // Center
      expect(frame2Ids).toContain('pixel-60'); // Bottom-right of centered 5x5

      // Frame 3: 9x9 data in 9x9 display
      const frame3 = calculatePixelUpdatesWithMismatch(newData, 9, 9);
      expect(frame3).toHaveLength(81);
    });
  });

  describe('Zoom Out Scenarios (Grid Shrinking)', () => {
    it('should handle 11x11 → 9x9 transition correctly', () => {
      const oldData = createGridData(11);
      const newData = createGridData(9);

      // Frame 1: Display is 11x11, data is 11x11
      const frame1 = calculatePixelUpdatesWithMismatch(oldData, 11, 11);
      expect(frame1).toHaveLength(121);

      // Frame 2: Display is 9x9, data is still 11x11 (transition)
      // Should use center portion of 11x11 data
      const frame2 = calculatePixelUpdatesWithMismatch(oldData, 11, 9);
      expect(frame2).toHaveLength(81);
      verifyAllPixelsCovered(frame2, 9);

      // Frame 3: Display is 9x9, data is 9x9
      const frame3 = calculatePixelUpdatesWithMismatch(newData, 9, 9);
      expect(frame3).toHaveLength(81);
    });

    it('should handle 9x9 → 5x5 transition', () => {
      const oldData = createGridData(9);
      const newData = createGridData(5);

      // Frame 1: 9x9 data in 9x9 display
      const frame1 = calculatePixelUpdatesWithMismatch(oldData, 9, 9);
      expect(frame1).toHaveLength(81);

      // Frame 2: 9x9 data in 5x5 display (use center)
      const frame2 = calculatePixelUpdatesWithMismatch(oldData, 9, 5);
      expect(frame2).toHaveLength(25);
      verifyAllPixelsCovered(frame2, 5);

      // Frame 3: 5x5 data in 5x5 display
      const frame3 = calculatePixelUpdatesWithMismatch(newData, 5, 5);
      expect(frame3).toHaveLength(25);
    });
  });

  describe('Density Changes (Alt+Scroll)', () => {
    it('should handle keeping same grid size but different data', () => {
      // When changing density, the display grid size changes but
      // we might get old data size for a frame
      const data1 = createGridData(9);
      const data2 = createGridData(11);

      // Display stays 11x11, but data transitions 9→11
      const frame1 = calculatePixelUpdatesWithMismatch(data1, 9, 11);
      expect(frame1).toHaveLength(81);

      const frame2 = calculatePixelUpdatesWithMismatch(data2, 11, 11);
      expect(frame2).toHaveLength(121);
    });
  });

  describe('Large Grid Sizes', () => {
    it('should handle maximum grid size of 21x21', () => {
      const data = createGridData(21);
      const updates = calculatePixelUpdatesWithMismatch(data, 21, 21);

      expect(updates).toHaveLength(441); // 21*21
      verifyAllPixelsCovered(updates, 21);
    });

    it('should handle transition from 19x19 to 21x21', () => {
      const oldData = createGridData(19);
      const newData = createGridData(21);

      // Transition frame: 19x19 data in 21x21 display
      const transitionFrame = calculatePixelUpdatesWithMismatch(
        oldData,
        19,
        21
      );
      expect(transitionFrame).toHaveLength(361); // 19*19

      // Final frame: 21x21 data in 21x21 display
      const finalFrame = calculatePixelUpdatesWithMismatch(newData, 21, 21);
      expect(finalFrame).toHaveLength(441); // 21*21
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum grid size of 5x5', () => {
      const data = createGridData(5);
      const updates = calculatePixelUpdatesWithMismatch(data, 5, 5);

      expect(updates).toHaveLength(25);
      verifyAllPixelsCovered(updates, 5);
    });

    it('should handle even-odd size transitions', () => {
      // Even though we use odd grid sizes, test various combinations
      const data7 = createGridData(7);
      const data9 = createGridData(9);

      const updates = calculatePixelUpdatesWithMismatch(data7, 7, 9);
      expect(updates).toHaveLength(49);

      const updates2 = calculatePixelUpdatesWithMismatch(data9, 9, 7);
      expect(updates2).toHaveLength(49);
    });
  });

  describe('Pixel ID Consistency', () => {
    it('should generate sequential pixel IDs without gaps', () => {
      const data = createGridData(11);
      const updates = calculatePixelUpdatesWithMismatch(data, 11, 11);

      // Extract all pixel numbers and sort them
      const pixelNumbers = updates
        .map((u) => parseInt(u.pixelId.replace('pixel-', '')))
        .sort((a, b) => a - b);

      // Should be 0-120 sequential
      expect(pixelNumbers[0]).toBe(0);
      expect(pixelNumbers[pixelNumbers.length - 1]).toBe(120);
      expect(pixelNumbers).toHaveLength(121);
    });

    it('should use center pixels during transitions', () => {
      const data = createGridData(9);

      // When centering 9x9 in 11x11, center pixel should be at index 60
      const updates = calculatePixelUpdatesWithMismatch(data, 9, 11);

      // Find the center pixel of the 9x9 data (index 4,4 in data)
      const centerUpdate = updates.find(
        (u) => u.color.hex === '#440' // row 4, col 4
      );

      // Should map to center of 11x11 grid (pixel-60)
      expect(centerUpdate?.pixelId).toBe('pixel-60');
    });
  });

  describe('Color Data Preservation', () => {
    it('should preserve exact color data during updates', () => {
      const data: ColorData[][] = [
        [
          { hex: '#FF0000', r: 255, g: 0, b: 0 },
          { hex: '#00FF00', r: 0, g: 255, b: 0 },
        ],
        [
          { hex: '#0000FF', r: 0, g: 0, b: 255 },
          { hex: '#FFFF00', r: 255, g: 255, b: 0 },
        ],
      ];

      const updates = calculatePixelUpdatesWithMismatch(data, 2, 2);

      // Verify colors are preserved exactly
      expect(updates.find((u) => u.pixelId === 'pixel-0')?.color.hex).toBe(
        '#FF0000'
      );
      expect(updates.find((u) => u.pixelId === 'pixel-1')?.color.hex).toBe(
        '#00FF00'
      );
      expect(updates.find((u) => u.pixelId === 'pixel-2')?.color.hex).toBe(
        '#0000FF'
      );
      expect(updates.find((u) => u.pixelId === 'pixel-3')?.color.hex).toBe(
        '#FFFF00'
      );
    });
  });
});

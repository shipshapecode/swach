/**
 * Utility functions for managing pixel grid updates with proper index mapping.
 */

export interface ColorData {
  hex: string;
  r: number;
  g: number;
  b: number;
}

export interface PixelUpdate {
  pixelId: string;
  color: ColorData;
}

/**
 * Calculate the pixel element ID for a given row and column in a grid.
 */
export function getPixelId(row: number, col: number, gridSize: number): string {
  const index = row * gridSize + col;
  return `pixel-${index}`;
}

/**
 * Calculate all pixel updates needed when data size matches grid size.
 * This is the simple case - direct 1:1 mapping.
 */
export function calculatePixelUpdates(
  pixelData: ColorData[][],
  gridSize: number
): PixelUpdate[] {
  const updates: PixelUpdate[] = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const colorData = pixelData[row]?.[col];
      if (colorData) {
        updates.push({
          pixelId: getPixelId(row, col, gridSize),
          color: colorData,
        });
      }
    }
  }

  return updates;
}

/**
 * Calculate pixel updates when incoming data size doesn't match current grid size.
 * Centers the smaller grid within the larger grid.
 */
export function calculatePixelUpdatesWithMismatch(
  pixelData: ColorData[][],
  dataSize: number,
  displayGridSize: number
): PixelUpdate[] {
  const updates: PixelUpdate[] = [];

  if (dataSize === displayGridSize) {
    // No mismatch, use simple path
    return calculatePixelUpdates(pixelData, displayGridSize);
  }

  // Calculate offset to center the smaller grid
  const offset = Math.floor(Math.abs(displayGridSize - dataSize) / 2);

  if (dataSize < displayGridSize) {
    // Data is smaller than display grid - center it
    for (let dataRow = 0; dataRow < dataSize; dataRow++) {
      for (let dataCol = 0; dataCol < dataSize; dataCol++) {
        const colorData = pixelData[dataRow]?.[dataCol];
        if (colorData) {
          const displayRow = dataRow + offset;
          const displayCol = dataCol + offset;
          updates.push({
            pixelId: getPixelId(displayRow, displayCol, displayGridSize),
            color: colorData,
          });
        }
      }
    }
  } else {
    // Data is larger than display grid - use center portion
    for (let displayRow = 0; displayRow < displayGridSize; displayRow++) {
      for (let displayCol = 0; displayCol < displayGridSize; displayCol++) {
        const dataRow = displayRow + offset;
        const dataCol = displayCol + offset;
        const colorData = pixelData[dataRow]?.[dataCol];
        if (colorData) {
          updates.push({
            pixelId: getPixelId(displayRow, displayCol, displayGridSize),
            color: colorData,
          });
        }
      }
    }
  }

  return updates;
}

/**
 * Get the center pixel ID for a given grid size.
 */
export function getCenterPixelId(gridSize: number): string {
  const centerIndex = Math.floor((gridSize * gridSize) / 2);
  return `pixel-${centerIndex}`;
}

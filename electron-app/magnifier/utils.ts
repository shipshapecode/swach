export const AVAILABLE_DIAMETERS = [
  120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420,
];
export const AVAILABLE_GRID_SIZES = [5, 7, 9, 11, 13, 15, 17, 19, 21];
export const MIN_SQUARE_SIZE = 10;
export const MAX_SQUARE_SIZE = 40;

/**
 * Calculate the optimal grid size for a given diameter and square size.
 * Returns the closest available odd grid size that fits within the diameter.
 */
export function calculateOptimalGridSize(
  diameter: number,
  squareSize: number
): number {
  const idealGridSize = Math.floor(diameter / squareSize);
  const adjustedGridSize =
    idealGridSize % 2 === 0 ? idealGridSize - 1 : idealGridSize;

  const closestGridSize = AVAILABLE_GRID_SIZES.reduce((prev, curr) =>
    Math.abs(curr - adjustedGridSize) < Math.abs(prev - adjustedGridSize)
      ? curr
      : prev
  );

  return closestGridSize;
}

/**
 * Get the next diameter in the available diameters list.
 * Returns the current diameter if already at the boundary.
 */
export function getNextDiameter(
  currentDiameter: number,
  delta: number
): number {
  const currentIndex = AVAILABLE_DIAMETERS.indexOf(currentDiameter);
  const newIndex = Math.max(
    0,
    Math.min(AVAILABLE_DIAMETERS.length - 1, currentIndex + delta)
  );

  return AVAILABLE_DIAMETERS[newIndex]!;
}

/**
 * Adjust square size within bounds by a given delta.
 */
export function adjustSquareSize(
  currentSize: number,
  delta: number,
  step = 2
): number {
  return Math.max(
    MIN_SQUARE_SIZE,
    Math.min(MAX_SQUARE_SIZE, currentSize + delta * step)
  );
}

/**
 * Calculate the center pixel index for a given grid size.
 * Grid sizes are always odd, so center is (size * size - 1) / 2
 */
export function getCenterPixelIndex(gridSize: number): number {
  return Math.floor((gridSize * gridSize) / 2);
}

/**
 * Convert cursor position to image coordinates accounting for display scaling and bounds offset.
 */
export function cursorToImageCoordinates(
  cursorX: number,
  cursorY: number,
  scaleFactor: number,
  displayBounds: { x: number; y: number }
): { imageX: number; imageY: number } {
  // Convert global cursor coordinates to display-relative coordinates
  const displayRelativeX = cursorX - displayBounds.x;
  const displayRelativeY = cursorY - displayBounds.y;

  const logicalX = Math.round(displayRelativeX);
  const logicalY = Math.round(displayRelativeY);
  const imageX = logicalX * scaleFactor;
  const imageY = logicalY * scaleFactor;

  return { imageX, imageY };
}

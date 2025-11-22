/**
 * Calculate how many squares fit in a circle of given diameter.
 *
 * @param diameter - The diameter of the magnifier circle in pixels
 * @param squareSize - The size of each square in pixels
 * @returns The number of squares that fit (always odd for a center pixel)
 */
export function calculateGridSize(
  diameter: number,
  squareSize: number
): number {
  // How many squares fit in the diameter (round to get closest fit)
  const squaresFit = Math.round(diameter / squareSize);

  // Make it odd so we have a center pixel
  // If even, round up to next odd number (to fill the circle better)
  return squaresFit % 2 === 0 ? squaresFit + 1 : squaresFit;
}

/**
 * Calculate the actual rendered size of each square to perfectly fill the circle.
 * This handles rounding - e.g., if 9 squares of 20px = 180px but circle is 182px,
 * we render each square as 182/9 = 20.22px to fill perfectly.
 *
 * @param diameter - The diameter of the magnifier circle in pixels
 * @param gridSize - The number of squares in the grid
 * @returns The actual pixel size each square should be rendered at
 */
export function calculateActualSquareSize(
  diameter: number,
  gridSize: number
): number {
  return diameter / gridSize;
}

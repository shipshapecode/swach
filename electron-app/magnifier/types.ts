// Derived types from the actual magnifier API implementation
// This ensures types stay in sync with the actual implementation

import type { magnifierAPI } from './magnifier-preload';

// Export the main API type derived from the implementation
export type MagnifierAPI = typeof magnifierAPI;

// Extract parameter types from the callback functions for convenience
type UpdatePositionCallback = Parameters<
  typeof magnifierAPI.on.updatePosition
>[0];
type UpdatePixelGridCallback = Parameters<
  typeof magnifierAPI.on.updatePixelGrid
>[0];

// Derive the data types from the callback parameter types
export type PositionData = Parameters<UpdatePositionCallback>[0];
export type PixelGridData = Parameters<UpdatePixelGridCallback>[0];

// Extract nested types for convenience
export type ColorData = PixelGridData['centerColor'];

import './styles.css';

import {
  calculateActualSquareSize,
  calculateGridSize,
} from './grid-calculation';
import { calculatePixelUpdatesWithMismatch } from './pixel-grid-utils';
import type { PixelGridData, PositionData } from './types';

class MagnifierRenderer {
  private magnifierContainer: Element;
  private magnifierCircle: Element;
  private pixelGrid: Element;
  private colorName: Element;
  private hexCode: Element;
  private currentDiameter = 180; // Default matches index.html
  private currentSquareSize = 20; // Default square size
  private lastRenderedGridSize = 9; // Track what's in the DOM
  private lastDiameterZoomTime = 0;
  private readonly DIAMETER_ZOOM_THROTTLE_MS = 300;
  private hasShownCircle = false;

  // Derived state - calculated from diameter and square size
  private get currentGridSize(): number {
    return calculateGridSize(this.currentDiameter, this.currentSquareSize);
  }

  constructor() {
    const container = document.getElementById('magnifierContainer');
    const circle = document.querySelector('.magnifier-circle');
    const pixelGrid = document.getElementById('pixelGrid');
    const colorName = document.getElementById('colorName');
    const hexCode = document.getElementById('hexCode');

    if (!container || !circle || !pixelGrid || !colorName || !hexCode) {
      throw new Error('Required DOM elements not found for MagnifierRenderer');
    }

    this.magnifierContainer = container;
    this.magnifierCircle = circle;
    this.pixelGrid = pixelGrid;
    this.colorName = colorName;
    this.hexCode = hexCode;

    this.initialize();
  }

  private initialize(): void {
    this.createPixelGrid(9);
    this.setupEventListeners();
    this.setupIpcListeners();

    // Signal that magnifier is ready
    window.magnifierAPI.send.ready();

    // Focus the window for keyboard events
    window.focus();
  }

  private createPixelGrid(gridSize: number): void {
    this.lastRenderedGridSize = gridSize;
    const totalPixels = gridSize * gridSize;
    const centerIndex = Math.floor(totalPixels / 2);

    this.pixelGrid.innerHTML = '';

    // Calculate actual square size to fill the circle perfectly
    // This ensures the grid always fills the circle regardless of rounding
    const actualSquareSize = calculateActualSquareSize(
      this.currentDiameter,
      gridSize
    );

    const gridElement = this.pixelGrid as HTMLElement;
    gridElement.style.gridTemplateColumns = `repeat(${gridSize}, ${actualSquareSize}px)`;
    gridElement.style.gridTemplateRows = `repeat(${gridSize}, ${actualSquareSize}px)`;

    // Grid should exactly fill the circle
    gridElement.style.width = `${this.currentDiameter}px`;
    gridElement.style.height = `${this.currentDiameter}px`;

    // Ensure grid is centered and positioned correctly
    gridElement.style.position = 'absolute';
    gridElement.style.left = '50%';
    gridElement.style.top = '50%';
    gridElement.style.transform = 'translate(-50%, -50%)';

    for (let i = 0; i < totalPixels; i++) {
      const pixel = document.createElement('div');
      pixel.className = 'pixel';
      pixel.id = `pixel-${i}`;

      if (i === centerIndex) {
        pixel.className += ' center';
      }

      this.pixelGrid.appendChild(pixel);
    }
  }

  private updateMagnifierSize(diameter: number): void {
    this.currentDiameter = diameter;
    const circle = this.magnifierCircle as HTMLElement;
    // Ensure both dimensions are identical for a perfect circle
    circle.style.width = `${diameter}px`;
    circle.style.height = `${diameter}px`;
    circle.style.minWidth = `${diameter}px`;
    circle.style.minHeight = `${diameter}px`;
    circle.style.maxWidth = `${diameter}px`;
    circle.style.maxHeight = `${diameter}px`;
  }

  private setupEventListeners(): void {
    // Click to select color
    document.addEventListener('click', () => {
      window.magnifierAPI.send.colorSelected();
    });

    // Escape to cancel
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.magnifierAPI.send.cancelled();
      }
    });

    // Scroll wheel for zooming
    document.addEventListener(
      'wheel',
      (e: WheelEvent) => {
        e.preventDefault();

        const delta = e.deltaY > 0 ? -1 : 1;

        if (e.altKey) {
          // No throttling for density changes - keep them responsive
          window.magnifierAPI.send.zoomDensity(delta);
        } else {
          // Throttle diameter changes to prevent rapid fire zooming
          const now = Date.now();
          if (
            now - this.lastDiameterZoomTime <
            this.DIAMETER_ZOOM_THROTTLE_MS
          ) {
            return;
          }
          this.lastDiameterZoomTime = now;

          window.magnifierAPI.send.zoomDiameter(delta);
        }
      },
      { passive: false }
    );
  }

  private setupIpcListeners(): void {
    // Listen for position updates
    window.magnifierAPI.on.updatePosition((data: PositionData) => {
      const displayX = data.displayX || 0;
      const displayY = data.displayY || 0;
      // Keep container offset fixed at 100px (half of initial 200px container)
      // The circle will be centered within the container via flexbox
      const offset = 100;
      const translateX = data.x - displayX - offset;
      const translateY = data.y - displayY - offset;

      (this.magnifierContainer as HTMLElement).style.transform =
        `translate(${translateX}px, ${translateY}px)`;

      // Show circle on first position update (after it's correctly positioned)
      if (!this.hasShownCircle) {
        this.hasShownCircle = true;
        this.magnifierCircle.classList.remove('opacity-0');
      }
    });

    // Listen for pixel grid updates
    window.magnifierAPI.on.updatePixelGrid((data: PixelGridData) => {
      const centerColor = data.centerColor;
      const currentColorName = data.colorName || 'Unknown';

      this.colorName.textContent = currentColorName;
      this.hexCode.textContent = centerColor.hex.toUpperCase();

      // Update square size if provided (from alt+scroll)
      if (
        (data as any).squareSize &&
        (data as any).squareSize !== this.currentSquareSize
      ) {
        this.currentSquareSize = (data as any).squareSize;
      }

      // Update diameter if changed (from normal scroll)
      if (data.diameter && data.diameter !== this.currentDiameter) {
        this.currentDiameter = data.diameter;
        this.updateMagnifierSize(data.diameter);
      }

      // Calculate grid size based on current diameter and square size
      // This is DERIVED STATE - always calculated, never stored separately
      const calculatedGridSize = this.currentGridSize;

      // Recreate grid if calculated size changed from what's rendered
      if (calculatedGridSize !== this.lastRenderedGridSize) {
        this.createPixelGrid(calculatedGridSize);
      }

      // Recreate grid if calculated size changed from what's rendered
      if (calculatedGridSize !== this.lastRenderedGridSize) {
        this.createPixelGrid(calculatedGridSize);
      }

      // Update pixel colors using proper coordinate mapping
      if (data.pixels && data.pixels.length > 0) {
        const incomingDataSize = data.pixels.length;

        // Calculate which pixels need to be updated with proper coordinate mapping
        // This handles size mismatches during transitions by centering smaller grids
        const updates = calculatePixelUpdatesWithMismatch(
          data.pixels,
          incomingDataSize,
          this.lastRenderedGridSize
        );

        // Apply all updates
        for (const update of updates) {
          const pixel = document.getElementById(update.pixelId);
          if (pixel) {
            pixel.style.backgroundColor = update.color.hex;
          }
        }
      }
    });
  }
}

// Initialize the magnifier when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new MagnifierRenderer());
} else {
  new MagnifierRenderer();
}

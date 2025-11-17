import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { colornames } from 'color-name-list';
import { BrowserWindow, globalShortcut, ipcMain, screen } from 'electron';
import isDev from 'electron-is-dev';
import { type Menubar } from 'menubar';
import nearestColor from 'nearest-color';
import * as screenshots from 'node-screenshots';

// __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ColorInfo {
  hex: string;
  r: number;
  g: number;
  b: number;
}

class MagnifyingColorPicker {
  private magnifierWindow: BrowserWindow | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private isActive = false;
  private cachedScreenshot: {
    image: any;
    rawData: Uint8Array;
    monitor: any;
  } | null = null;
  private nearestColorFn: ({
    r,
    g,
    b,
  }: {
    r: number;
    g: number;
    b: number;
  }) => { name: string };

  constructor() {
    // Setup color name lookup function
    const namedColors = colornames.reduce(
      (
        o: { [key: string]: string },
        { name, hex }: { name: string; hex: string }
      ) => Object.assign(o, { [name]: hex }),
      {}
    );
    this.nearestColorFn = nearestColor.from(namedColors);
  }

  private getColorName(r: number, g: number, b: number): string {
    const result = this.nearestColorFn({ r, g, b });
    return result.name;
  }

  async pickColor(): Promise<string | null> {
    console.log('[Magnifying Color Picker] Starting...');

    if (this.isActive) {
      return null;
    }

    this.isActive = true;

    try {
      // Take screenshot ONCE when starting, before magnifier window appears
      await this.captureInitialScreenshot();
      await this.createMagnifierWindow();
      return await this.startColorPicking();
    } catch (error) {
      console.error('[Magnifying Color Picker] Error:', error);
      return null;
    } finally {
      this.cleanup();
    }
  }

  private async captureInitialScreenshot(): Promise<void> {
    console.log('[Magnifying Color Picker] Taking initial screenshot...');

    // Get the primary display for initial capture
    const primaryDisplay = screen.getPrimaryDisplay();
    const centerX = Math.floor(primaryDisplay.workAreaSize.width / 2);
    const centerY = Math.floor(primaryDisplay.workAreaSize.height / 2);

    const monitor = screenshots.Monitor.fromPoint(centerX, centerY);
    if (!monitor) {
      throw new Error('No monitor found for initial screenshot');
    }

    const fullImage = monitor.captureImageSync();
    const rawImageData = fullImage.toRawSync();

    this.cachedScreenshot = {
      image: fullImage,
      rawData: rawImageData,
      monitor: monitor,
    };

    console.log(
      `[Magnifying Color Picker] Cached screenshot: ${fullImage.width}x${fullImage.height}`
    );
  }

  private async createMagnifierWindow(): Promise<void> {
    console.log('[Magnifying Color Picker] Creating magnifier window...');

    // Create magnifying glass overlay
    this.magnifierWindow = new BrowserWindow({
      width: 200,
      height: 200,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      focusable: true,
      show: false,
      hasShadow: false, // Remove OS window shadow/border
      webPreferences: {
        // TODO: probably make this false
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    this.magnifierWindow.setAlwaysOnTop(true, 'screen-saver');

    // Start at center of screen initially
    const primaryDisplay = screen.getPrimaryDisplay();
    this.magnifierWindow.setPosition(
      Math.floor(primaryDisplay.workAreaSize.width / 2) - 100,
      Math.floor(primaryDisplay.workAreaSize.height / 2) - 100
    );

    let htmlFilePath: string;
    if (isDev) {
      // In development, use the source directory
      htmlFilePath = join(
        __dirname,
        '../../electron-app/resources',
        'magnifier-picker.html'
      );
    } else {
      // In production, use the packaged resources directory
      htmlFilePath = join(
        process.resourcesPath,
        'resources',
        'magnifier-picker.html'
      );
    }

    await this.magnifierWindow.loadFile(htmlFilePath);
    this.magnifierWindow.show();

    console.log('[Magnifying Color Picker] Magnifier window created and shown');
  }

  private async startColorPicking(): Promise<string | null> {
    return new Promise((resolve) => {
      let currentColor = '#FFFFFF';
      let hasResolved = false;

      const resolveOnce = (result: string | null) => {
        if (!hasResolved) {
          hasResolved = true;
          resolve(result);
        }
      };

      // Set up IPC handlers
      const handleReady = () => {
        console.log('[Magnifying Color Picker] ✅ Magnifier ready');
      };

      const handleColorSelected = () => {
        console.log('[Magnifying Color Picker] Color selected:', currentColor);
        resolveOnce(currentColor);
      };

      const handleCancelled = () => {
        console.log('[Magnifying Color Picker] Cancelled');
        resolveOnce(null);
      };

      // Register IPC handlers
      ipcMain.once('magnifier-ready', handleReady);
      ipcMain.once('color-selected', handleColorSelected);
      ipcMain.once('picker-cancelled', handleCancelled);

      // Register global escape
      globalShortcut.register('Escape', () => {
        resolveOnce(null);
      });

      // Start cursor tracking with color update callback
      this.startCursorTracking((color: string) => {
        currentColor = color;
      });

      // No timeout - let user take as long as they want
    });
  }

  private startCursorTracking(onColorChange: (color: string) => void): void {
    console.log('[Magnifying Color Picker] Starting fluid cursor tracking');

    let lastCursorPos = { x: -1, y: -1 };
    let lastCapturePos = { x: -1, y: -1 };

    this.updateInterval = setInterval(() => {
      if (!this.magnifierWindow || this.magnifierWindow.isDestroyed()) {
        if (this.updateInterval) {
          clearInterval(this.updateInterval);
          this.updateInterval = null;
        }
        return;
      }

      const cursorPos = screen.getCursorScreenPoint();

      // Always update position for completely fluid movement
      if (cursorPos.x !== lastCursorPos.x || cursorPos.y !== lastCursorPos.y) {
        lastCursorPos = cursorPos;
        this.updateMagnifierPosition(cursorPos);

        // Capture pixels when cursor moved at least 1 pixel (responsive but not excessive)
        const captureNeeded =
          Math.abs(cursorPos.x - lastCapturePos.x) >= 1 ||
          Math.abs(cursorPos.y - lastCapturePos.y) >= 1;

        if (captureNeeded) {
          lastCapturePos = cursorPos;
          this.capturePixelGrid(cursorPos, onColorChange);
        }
      }
    }, 8); // 120fps for ultra-smooth tracking
  }

  private updateMagnifierPosition(cursorPos: { x: number; y: number }): void {
    if (!this.magnifierWindow) return;

    // Position magnifier so the CENTER SQUARE of the 9x9 grid is exactly on the cursor
    // The magnifier circle is now centered in a 200px window
    // Circle is 150px, so it starts at (200-150)/2 = 25px from window edge
    // Each grid cell is 150px / 9 = 16.67px
    // Center square is at (4 * 16.67 + 8.33) = 75px from grid edge
    // Total: 25px (window margin) + 75px (to center) = 100px from window edge
    const newX = cursorPos.x - 100; // Position so center square is on cursor
    const newY = cursorPos.y - 100; // Position so center square is on cursor

    // Allow the magnifier window to go outside screen bounds so we can pick colors
    // at the very edges of the screen. The window will be partially offscreen but
    // the center square will still be exactly on the cursor position.
    this.magnifierWindow.setPosition(newX, newY);
  }

  private capturePixelGrid(
    cursorPos: { x: number; y: number },
    onColorChange: (color: string) => void
  ): void {
    try {
      // Use cached screenshot instead of taking a new one!
      if (!this.cachedScreenshot) {
        console.warn('[Debug] No cached screenshot available');
        return;
      }

      const {
        image: fullImage,
        rawData: rawImageData,
        monitor,
      } = this.cachedScreenshot;

      // Calculate cursor position in image coordinates using the cached monitor info
      const monitorX = cursorPos.x - monitor.x;
      const monitorY = cursorPos.y - monitor.y;

      // Simple scaling: image size / monitor size
      const scaleX = fullImage.width / monitor.width;
      const scaleY = fullImage.height / monitor.height;

      const imageX = Math.floor(monitorX * scaleX);
      const imageY = Math.floor(monitorY * scaleY);

      console.log(
        `[Debug] Using cached screenshot - Cursor: (${cursorPos.x}, ${cursorPos.y}) -> Image: (${imageX}, ${imageY})`
      );

      // Helper to read pixel at specific coordinates from cached data
      const getPixelAt = (x: number, y: number): ColorInfo | null => {
        // Bounds check
        if (x < 0 || y < 0 || x >= fullImage.width || y >= fullImage.height) {
          return null;
        }

        const pixelIndex = (y * fullImage.width + x) * 4;
        if (pixelIndex + 3 >= rawImageData.length) {
          return null;
        }

        const r = rawImageData[pixelIndex] || 0;
        const g = rawImageData[pixelIndex + 1] || 0;
        const b = rawImageData[pixelIndex + 2] || 0;
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

        return { hex, r, g, b };
      };

      // Get center color at cursor position
      const centerColor = getPixelAt(imageX, imageY);
      if (!centerColor) {
        console.warn(`[Debug] Could not read pixel at (${imageX}, ${imageY})`);
        return;
      }

      console.log(`[Debug] Center color from cache: ${centerColor.hex}`);
      onColorChange(centerColor.hex);

      // Build 9x9 grid around cursor
      const gridSize = 9;
      const halfSize = 4; // (9-1)/2
      const pixels: ColorInfo[][] = [];

      for (let row = 0; row < gridSize; row++) {
        pixels[row] = [];
        for (let col = 0; col < gridSize; col++) {
          const gridImageX = imageX - halfSize + col;
          const gridImageY = imageY - halfSize + row;

          const pixelColor = getPixelAt(gridImageX, gridImageY);
          pixels[row]![col] = pixelColor || {
            hex: '#808080',
            r: 128,
            g: 128,
            b: 128,
          }; // Gray fallback
        }
      }

      // Get color name for center color
      const colorName = this.getColorName(
        centerColor.r,
        centerColor.g,
        centerColor.b
      );

      // Send to renderer
      if (this.magnifierWindow && !this.magnifierWindow.isDestroyed()) {
        this.magnifierWindow.webContents.send('update-pixel-grid', {
          centerColor,
          colorName,
          pixels,
          cursorPos,
        });
      }
    } catch (error) {
      console.warn('[Debug] Capture error:', error);
    }
  }

  private cleanup(): void {
    console.log('[Magnifying Color Picker] Cleaning up...');

    this.isActive = false;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.magnifierWindow && !this.magnifierWindow.isDestroyed()) {
      this.magnifierWindow.close();
      this.magnifierWindow = null;
    }

    // Clear cached screenshot
    this.cachedScreenshot = null;

    // Clean up IPC handlers
    ipcMain.removeAllListeners('magnifier-ready');
    ipcMain.removeAllListeners('color-selected');
    ipcMain.removeAllListeners('picker-cancelled');

    // Unregister shortcuts
    globalShortcut.unregister('Escape');

    console.log('[Magnifying Color Picker] Cleanup completed');
  }
}

async function launchMagnifyingColorPicker(
  mb: Menubar,
  type = 'global'
): Promise<void> {
  const picker = new MagnifyingColorPicker();

  try {
    // Hide window and wait for it to be fully hidden
    if (mb.window && !mb.window.isDestroyed()) {
      const hidePromise = new Promise<void>((resolve) => {
        if (mb.window!.isVisible()) {
          mb.window!.once('hide', () => resolve());
          mb.hideWindow();
        } else {
          resolve();
        }
      });
      await hidePromise;
    } else {
      mb.hideWindow();
    }

    const color = await picker.pickColor();

    if (color) {
      console.log('[Magnifying Color Picker] Selected color:', color);

      if (type === 'global') {
        mb.window!.webContents.send('changeColor', color);
      }
      if (type === 'contrastBg') {
        mb.window!.webContents.send('pickContrastBgColor', color);
      }
      if (type === 'contrastFg') {
        mb.window!.webContents.send('pickContrastFgColor', color);
      }
    }
  } finally {
    void mb.showWindow();
  }
}

export { launchMagnifyingColorPicker };

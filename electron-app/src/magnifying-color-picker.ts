import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { colornames } from 'color-name-list';
import {
  BrowserWindow,
  desktopCapturer,
  globalShortcut,
  ipcMain,
  screen,
} from 'electron';
import isDev from 'electron-is-dev';
import { type Menubar } from 'menubar';
import nearestColor from 'nearest-color';

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
    bitmap: Buffer;
    width: number;
    height: number;
    display: Electron.Display;
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

    // Get cursor position and find its display
    const cursorPos = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursorPos);

    console.log(
      `[Magnifying Color Picker] Capturing display: ${display.id}, bounds: ${JSON.stringify(display.bounds)}, scaleFactor: ${display.scaleFactor}`
    );

    // Capture all screens at native resolution
    // Use display.size (not bounds) to include dock/menubar areas
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: display.size.width * display.scaleFactor,
        height: display.size.height * display.scaleFactor,
      },
    });

    // Find the source matching our display
    // For now, use the first source (primary screen)
    // TODO: Implement smarter matching for multi-monitor setups
    const source = sources[0];

    if (!source) {
      throw new Error('No screen source found for capture');
    }

    const nativeImage = source.thumbnail;
    const bitmap = nativeImage.toBitmap(); // Returns Buffer in BGRA format

    this.cachedScreenshot = {
      bitmap: bitmap,
      width: nativeImage.getSize().width,
      height: nativeImage.getSize().height,
      display: display,
    };

    const expectedWidth = display.size.width * display.scaleFactor;
    const expectedHeight = display.size.height * display.scaleFactor;

    console.log(
      `[Magnifying Color Picker] Cached screenshot: ${this.cachedScreenshot.width}x${this.cachedScreenshot.height} ` +
        `(expected ${expectedWidth}x${expectedHeight}, scale=${display.scaleFactor}, includes dock/menubar)`
    );
  }

  private async createMagnifierWindow(): Promise<void> {
    console.log('[Magnifying Color Picker] Creating magnifier window...');

    // Get the display containing the cursor
    const cursorPos = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursorPos);

    console.log(
      `[Magnifying Color Picker] Creating fullscreen overlay on display: ${display.id}, bounds: ${JSON.stringify(display.bounds)}`
    );

    // Create fullscreen transparent overlay covering entire display
    // This allows smooth cursor tracking via CSS transforms instead of window movement
    // Use display.size (not bounds) to cover the FULL screen including dock/menubar
    this.magnifierWindow = new BrowserWindow({
      x: 0,
      y: 0,
      width: display.size.width,
      height: display.size.height,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      focusable: true,
      show: false,
      hasShadow: false,
      webPreferences: {
        // TODO: probably make this false
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    this.magnifierWindow.setAlwaysOnTop(true, 'screen-saver');

    // Don't forward mouse events - we want to capture clicks to prevent
    // them from reaching dock/apps below, while still allowing the magnifier
    // to receive color selection clicks
    // Note: We do NOT use setIgnoreMouseEvents here

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
    if (!this.magnifierWindow || this.magnifierWindow.isDestroyed()) return;

    // Instead of moving the window, send cursor position to renderer
    // The renderer will move the magnifier UI via CSS transform for smooth movement
    // This is especially important for Linux compatibility where rapid window
    // repositioning doesn't work well
    // Since the window covers the full screen starting at (0,0), we don't need
    // to subtract display bounds
    this.magnifierWindow.webContents.send('update-magnifier-position', {
      x: cursorPos.x,
      y: cursorPos.y,
      displayX: 0,
      displayY: 0,
    });
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

      const { bitmap, width, height, display } = this.cachedScreenshot;

      // Calculate cursor position in image coordinates
      // Since we capture the full display (including dock/menubar), cursor position
      // is already in the right coordinate space (no offset needed)
      const monitorX = cursorPos.x;
      const monitorY = cursorPos.y;

      // Simple scaling: image size / display size
      const scaleX = width / display.size.width;
      const scaleY = height / display.size.height;

      const imageX = Math.floor(monitorX * scaleX);
      const imageY = Math.floor(monitorY * scaleY);

      console.log(
        `[Debug] Cursor screen: (${cursorPos.x}, ${cursorPos.y}), ` +
          `Display size: ${display.size.width}x${display.size.height}, ` +
          `Image size: ${width}x${height}, ` +
          `Scale: (${scaleX.toFixed(2)}, ${scaleY.toFixed(2)}), ` +
          `Image pos: (${imageX}, ${imageY})`
      );

      // Helper to read pixel at specific coordinates from cached data
      const getPixelAt = (x: number, y: number): ColorInfo | null => {
        // Bounds check
        if (x < 0 || y < 0 || x >= width || y >= height) {
          return null;
        }

        const pixelIndex = (y * width + x) * 4;
        if (pixelIndex + 3 >= bitmap.length) {
          return null;
        }

        // CRITICAL: toBitmap() returns BGRA format, not RGBA!
        const b = bitmap[pixelIndex] || 0;
        const g = bitmap[pixelIndex + 1] || 0;
        const r = bitmap[pixelIndex + 2] || 0;
        // const a = bitmap[pixelIndex + 3] || 0; // Alpha (unused)

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

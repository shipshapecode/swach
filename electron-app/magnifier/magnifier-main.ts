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

import {
  adjustSquareSize,
  calculateOptimalGridSize,
  cursorToImageCoordinates,
  getNextDiameter,
} from './utils';

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
  private magnifierDiameter = 180;
  private squareSize = 20;
  private gridSize = 9;
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
    if (this.isActive) {
      return null;
    }

    this.isActive = true;

    try {
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
    const cursorPos = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursorPos);

    console.log('[DEBUG] Cursor position:', cursorPos);
    console.log('[DEBUG] Display info:', {
      id: display.id,
      bounds: display.bounds,
      size: display.size,
      scaleFactor: display.scaleFactor,
    });

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: display.size.width * display.scaleFactor,
        height: display.size.height * display.scaleFactor,
      },
    });

    console.log(
      '[DEBUG] desktopCapturer.getSources() returned:',
      sources.length,
      'sources'
    );
    sources.forEach((s, index) => {
      console.log(`[DEBUG] Source ${index}:`, {
        id: s.id,
        name: s.name,
        display_id: s.display_id,
        appIcon: s.appIcon ? 'present' : 'null',
        thumbnail: s.thumbnail
          ? `${s.thumbnail.getSize().width}x${s.thumbnail.getSize().height}`
          : 'null',
      });
    });
    console.log('[DEBUG] Looking for display_id:', display.id.toString());

    // Find the source that matches the display under the cursor
    let source = sources.find((s) => s.display_id === display.id.toString());

    // Fallback: if no matching display_id, just use the first source
    if (!source && sources.length > 0) {
      console.warn(
        '[DEBUG] No matching display_id found, using first source as fallback'
      );
      source = sources[0];
    }

    if (!source) {
      console.error('[DEBUG] Failed to find any source!');
      console.error(
        '[DEBUG] Available display_ids:',
        sources.map((s) => s.display_id)
      );
      console.error('[DEBUG] Needed display_id:', display.id.toString());
      throw new Error(`No screen source found for display ${display.id}`);
    }

    console.log(
      '[DEBUG] Using source:',
      source.id,
      'display_id:',
      source.display_id
    );

    const nativeImage = source.thumbnail;
    const bitmap = nativeImage.toBitmap();

    this.cachedScreenshot = {
      bitmap,
      width: nativeImage.getSize().width,
      height: nativeImage.getSize().height,
      display,
    };
  }

  private async createMagnifierWindow(): Promise<void> {
    const cursorPos = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursorPos);

    this.magnifierWindow = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
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
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, 'magnifier-preload.js'),
      },
    });

    this.magnifierWindow.setAlwaysOnTop(true, 'screen-saver');

    if (isDev) {
      await this.magnifierWindow.loadURL('http://localhost:5173/');
    } else {
      const magnifierPath = join(
        __dirname,
        '../renderer/magnifier_window/index.html'
      );
      await this.magnifierWindow.loadFile(magnifierPath);
    }

    this.magnifierWindow.show();
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

      ipcMain.once('color-selected', () => resolveOnce(currentColor));
      ipcMain.once('picker-cancelled', () => resolveOnce(null));

      ipcMain.on('magnifier-zoom-diameter', (_event, delta: number) => {
        const newDiameter = getNextDiameter(this.magnifierDiameter, delta);

        if (newDiameter !== this.magnifierDiameter) {
          this.magnifierDiameter = newDiameter;
          this.gridSize = calculateOptimalGridSize(
            this.magnifierDiameter,
            this.squareSize
          );

          const cursorPos = screen.getCursorScreenPoint();
          this.capturePixelGrid(cursorPos, (color: string) => {
            currentColor = color;
          });
        }
      });

      ipcMain.on('magnifier-zoom-density', (_event, delta: number) => {
        const newSquareSize = adjustSquareSize(this.squareSize, delta);

        if (newSquareSize !== this.squareSize) {
          this.squareSize = newSquareSize;
          this.gridSize = calculateOptimalGridSize(
            this.magnifierDiameter,
            this.squareSize
          );

          const cursorPos = screen.getCursorScreenPoint();
          this.capturePixelGrid(cursorPos, (color: string) => {
            currentColor = color;
          });
        }
      });

      globalShortcut.register('Escape', () => resolveOnce(null));

      this.startCursorTracking((color: string) => {
        currentColor = color;
      });
    });
  }

  private startCursorTracking(onColorChange: (color: string) => void): void {
    let lastCursorPos = { x: -1, y: -1 };

    this.updateInterval = setInterval(() => {
      if (!this.magnifierWindow || this.magnifierWindow.isDestroyed()) {
        if (this.updateInterval) {
          clearInterval(this.updateInterval);
          this.updateInterval = null;
        }
        return;
      }

      const cursorPos = screen.getCursorScreenPoint();

      if (cursorPos.x !== lastCursorPos.x || cursorPos.y !== lastCursorPos.y) {
        lastCursorPos = cursorPos;
        this.updateMagnifierPosition(cursorPos);
        this.capturePixelGrid(cursorPos, onColorChange);
      }
    }, 8);
  }

  private updateMagnifierPosition(cursorPos: { x: number; y: number }): void {
    if (!this.magnifierWindow || this.magnifierWindow.isDestroyed()) return;

    const windowBounds = this.magnifierWindow.getBounds();

    this.magnifierWindow.webContents.send('update-magnifier-position', {
      x: cursorPos.x,
      y: cursorPos.y,
      displayX: windowBounds.x,
      displayY: windowBounds.y,
    });
  }

  private capturePixelGrid(
    cursorPos: { x: number; y: number },
    onColorChange: (color: string) => void
  ): void {
    if (!this.cachedScreenshot) return;

    const { bitmap, width, height, display } = this.cachedScreenshot;

    const { imageX, imageY } = cursorToImageCoordinates(
      cursorPos.x,
      cursorPos.y,
      display.scaleFactor,
      display.bounds
    );

    const getPixelAt = (x: number, y: number): ColorInfo | null => {
      if (x < 0 || y < 0 || x >= width || y >= height) {
        return null;
      }

      const pixelIndex = (y * width + x) * 4;
      if (pixelIndex + 3 >= bitmap.length) {
        return null;
      }

      const b = bitmap[pixelIndex] || 0;
      const g = bitmap[pixelIndex + 1] || 0;
      const r = bitmap[pixelIndex + 2] || 0;

      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

      return { hex, r, g, b };
    };

    const centerColor = getPixelAt(imageX, imageY);
    if (!centerColor) return;

    onColorChange(centerColor.hex);

    const gridSize = this.gridSize;
    const halfSize = Math.floor(gridSize / 2);
    const pixels: ColorInfo[][] = [];

    // Sample at logical pixel boundaries (scaleFactor apart) instead of physical pixels
    // This ensures each cursor position maps to a unique grid position
    const step = display.scaleFactor;

    for (let row = 0; row < gridSize; row++) {
      pixels[row] = [];
      for (let col = 0; col < gridSize; col++) {
        const gridImageX = Math.floor(imageX - halfSize * step + col * step);
        const gridImageY = Math.floor(imageY - halfSize * step + row * step);

        const pixelColor = getPixelAt(gridImageX, gridImageY);
        pixels[row]![col] = pixelColor || {
          hex: '#808080',
          r: 128,
          g: 128,
          b: 128,
        };
      }
    }

    const colorName = this.getColorName(
      centerColor.r,
      centerColor.g,
      centerColor.b
    );

    if (this.magnifierWindow && !this.magnifierWindow.isDestroyed()) {
      this.magnifierWindow.webContents.send('update-pixel-grid', {
        centerColor,
        colorName,
        pixels,
        diameter: this.magnifierDiameter,
        gridSize: this.gridSize,
      });
    }
  }

  private cleanup(): void {
    this.isActive = false;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.magnifierWindow && !this.magnifierWindow.isDestroyed()) {
      this.magnifierWindow.close();
      this.magnifierWindow = null;
    }

    this.cachedScreenshot = null;

    ipcMain.removeAllListeners('magnifier-ready');
    ipcMain.removeAllListeners('color-selected');
    ipcMain.removeAllListeners('picker-cancelled');
    ipcMain.removeAllListeners('magnifier-zoom-diameter');
    ipcMain.removeAllListeners('magnifier-zoom-density');

    globalShortcut.unregister('Escape');
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

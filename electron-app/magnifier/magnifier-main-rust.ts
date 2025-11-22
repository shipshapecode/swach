import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { colornames } from 'color-name-list';
import { BrowserWindow, globalShortcut, ipcMain, screen } from 'electron';
import isDev from 'electron-is-dev';
import { type Menubar } from 'menubar';
import nearestColor from 'nearest-color';

import { RustSamplerManager } from '../src/rust-sampler-manager.js';
import {
  adjustSquareSize,
  calculateOptimalGridSize,
  getNextDiameter,
} from './utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MagnifyingColorPicker {
  private magnifierWindow: BrowserWindow | null = null;
  private isActive = false;
  private samplerManager: RustSamplerManager;
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
    this.samplerManager = new RustSamplerManager();
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
      await this.createMagnifierWindow();
      return await this.startColorPicking();
    } catch (error) {
      console.error('[Magnifying Color Picker] Error:', error);
      return null;
    } finally {
      this.cleanup();
    }
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

    // Set to screen-saver level
    this.magnifierWindow.setAlwaysOnTop(true, 'screen-saver');

    // Prevent this window from being captured in screen recordings/screenshots
    // This makes it invisible to CGWindowListCreateImage and other capture APIs
    this.magnifierWindow.setContentProtection(true);
    console.log(
      '[Magnifier] Set content protection to exclude from screen capture'
    );

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

          // Update grid size in Rust sampler
          this.samplerManager.updateGridSize(this.gridSize);
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

          // Update grid size in Rust sampler
          this.samplerManager.updateGridSize(this.gridSize);
        }
      });

      globalShortcut.register('Escape', () => resolveOnce(null));

      // Start the Rust sampler
      // Note: macOS screen capture takes ~50-80ms per frame
      // Setting to 15 Hz provides smooth experience without overloading

      // Get the native window ID so Rust can exclude it from capture
      let excludeWindowId = 0;
      if (this.magnifierWindow && process.platform === 'darwin') {
        try {
          // Get CGWindowID from native handle
          const handle = this.magnifierWindow.getNativeWindowHandle();
          // On macOS, the window ID is stored as a uint32 at offset 0
          excludeWindowId = handle.readUInt32LE(0);
          console.log('[Magnifier] Window ID for exclusion:', excludeWindowId);
        } catch (e) {
          console.warn('[Magnifier] Could not get window ID:', e);
        }
      }

      this.samplerManager.start(
        this.gridSize,
        15, // 15 Hz sample rate (realistic for screen capture)
        excludeWindowId, // Pass window ID to exclude from capture
        (pixelData) => {
          // Update current color
          currentColor = pixelData.center.hex;

          // Get color name
          const colorName = this.getColorName(
            pixelData.center.r,
            pixelData.center.g,
            pixelData.center.b
          );

          // Update magnifier position
          this.updateMagnifierPosition(pixelData.cursor);

          // Send pixel grid to renderer
          if (this.magnifierWindow && !this.magnifierWindow.isDestroyed()) {
            this.magnifierWindow.webContents.send('update-pixel-grid', {
              centerColor: pixelData.center,
              colorName,
              pixels: pixelData.grid,
              diameter: this.magnifierDiameter,
              gridSize: this.gridSize,
            });
          }
        },
        (error) => {
          console.error('[Magnifying Color Picker] Sampler error:', error);
          // Continue even on errors - they might be transient
        }
      );
    });
  }

  private updateMagnifierPosition(cursor: { x: number; y: number }): void {
    if (!this.magnifierWindow || this.magnifierWindow.isDestroyed()) return;

    const windowBounds = this.magnifierWindow.getBounds();

    this.magnifierWindow.webContents.send('update-magnifier-position', {
      x: cursor.x,
      y: cursor.y,
      displayX: windowBounds.x,
      displayY: windowBounds.y,
    });
  }

  private cleanup(): void {
    this.isActive = false;

    // Stop the Rust sampler
    this.samplerManager.stop();

    if (this.magnifierWindow && !this.magnifierWindow.isDestroyed()) {
      this.magnifierWindow.close();
      this.magnifierWindow = null;
    }

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

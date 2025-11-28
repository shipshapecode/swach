import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { colornames } from 'color-name-list';
import { BrowserWindow, globalShortcut, ipcMain, screen } from 'electron';
import isDev from 'electron-is-dev';
import { type Menubar } from 'menubar';
import nearestColor from 'nearest-color';

import {
  RustSamplerManager,
  type PixelData,
} from '../src/rust-sampler-manager.js';
import { calculateGridSize } from './grid-calculation.js';
import { adjustSquareSize, getNextDiameter } from './utils.js';

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
      // Pre-start the sampler to trigger permission dialogs BEFORE showing magnifier
      // This is critical on Wayland where the permission dialog needs to be clickable
      console.log(
        '[Magnifying Color Picker] Pre-starting sampler for permission check...'
      );
      await this.samplerManager.ensureStarted(this.gridSize, 15);
      console.log('[Magnifying Color Picker] Sampler ready, showing magnifier');

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
    // macOS: Uses NSWindowSharingNone - works perfectly with CGWindowListCreateImage
    // Windows: Uses WDA_EXCLUDEFROMCAPTURE (Windows 10 2004+) - should work
    // Linux: Limited/no support depending on compositor
    this.magnifierWindow.setContentProtection(true);
    console.log(`[Magnifier] Set content protection on ${process.platform}`);

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
          console.log(
            `[Magnifier] Diameter change: ${this.magnifierDiameter} → ${newDiameter}`
          );
          this.magnifierDiameter = newDiameter;
          const oldGridSize = this.gridSize;
          this.gridSize = calculateGridSize(
            this.magnifierDiameter,
            this.squareSize
          );

          console.log(
            `[Magnifier] Grid size change: ${oldGridSize} → ${this.gridSize}`
          );

          // Update grid size in Rust sampler
          this.samplerManager.updateGridSize(this.gridSize);
        }
      });

      ipcMain.on('magnifier-zoom-density', (_event, delta: number) => {
        const newSquareSize = adjustSquareSize(this.squareSize, delta);

        if (newSquareSize !== this.squareSize) {
          console.log(
            `[Magnifier] Square size change: ${this.squareSize} → ${newSquareSize}`
          );
          this.squareSize = newSquareSize;
          const oldGridSize = this.gridSize;
          this.gridSize = calculateGridSize(
            this.magnifierDiameter,
            this.squareSize
          );

          console.log(
            `[Magnifier] Grid size change: ${oldGridSize} → ${this.gridSize}`
          );

          // Update grid size in Rust sampler
          this.samplerManager.updateGridSize(this.gridSize);
        }
      });

      globalShortcut.register('Escape', () => resolveOnce(null));

      // Set up data callback for the sampler
      const dataCallback = (pixelData: PixelData) => {
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
            squareSize: this.squareSize,
          });
        }
      };

      const errorCallback = (error: string) => {
        console.error('[Magnifying Color Picker] Sampler error:', error);
        // Continue even on errors - they might be transient
      };

      // Start the Rust sampler if not already running
      // (it may already be running from ensureStarted)
      if (!this.samplerManager.isRunning()) {
        console.log('[Magnifier] Starting sampler (not yet running)');
        this.samplerManager.start(
          this.gridSize,
          15, // 15 Hz sample rate (realistic for screen capture)
          dataCallback,
          errorCallback
        );
      } else {
        console.log(
          '[Magnifier] Sampler already running from ensureStarted, updating callbacks'
        );
        // Replace callbacks since ensureStarted used temporary ones
        this.samplerManager.dataCallback = dataCallback;
        this.samplerManager.errorCallback = errorCallback;
      }
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
      if (mb.window && !mb.window.isDestroyed()) {
        if (type === 'global') {
          mb.window.webContents.send('changeColor', color);
        }
        if (type === 'contrastBg') {
          mb.window.webContents.send('pickContrastBgColor', color);
        }
        if (type === 'contrastFg') {
          mb.window.webContents.send('pickContrastFgColor', color);
        }
      }
    }
  } finally {
    void mb.showWindow();
  }
}

export { launchMagnifyingColorPicker };

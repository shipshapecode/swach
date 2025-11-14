import { BrowserWindow, globalShortcut, ipcMain, screen } from 'electron';
import { type Menubar } from 'menubar';
import * as screenshots from 'node-screenshots';

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

  async pickColor(): Promise<string | null> {
    console.log('[Magnifying Color Picker] Starting...');

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
    console.log('[Magnifying Color Picker] Creating magnifier window...');

    // Create magnifying glass overlay
    this.magnifierWindow = new BrowserWindow({
      width: 220,
      height: 320,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      focusable: true,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    // Start at center of screen initially
    const primaryDisplay = screen.getPrimaryDisplay();
    this.magnifierWindow.setPosition(
      Math.floor(primaryDisplay.workAreaSize.width / 2) - 110,
      Math.floor(primaryDisplay.workAreaSize.height / 2) - 160
    );

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 0;
          background: transparent;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          cursor: none;
          user-select: none;
          overflow: hidden;
        }
        
        .magnifier-container {
          position: relative;
          width: 220px;
          height: 320px;
        }
        
        .magnifier-circle {
          position: absolute;
          top: 10px;
          left: 10px;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          border: 4px solid #ffffff;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          background: #000;
        }
        
        .pixel-grid {
          position: absolute;
          top: 0;
          left: 0;
          width: 200px;
          height: 200px;
          display: grid;
          grid-template-columns: repeat(9, 1fr);
          grid-template-rows: repeat(9, 1fr);
        }
        
        .pixel {
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-sizing: border-box;
        }
        
        .pixel.center {
          border: 3px solid #ff0000;
          box-shadow: 0 0 6px #ff0000, inset 0 0 4px rgba(255, 0, 0, 0.3);
          z-index: 10;
          position: relative;
        }
        
        .color-info {
          position: absolute;
          top: 230px;
          left: 10px;
          right: 10px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          text-align: center;
        }
        
        .color-preview {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          border: 2px solid #333;
          margin: 0 auto 8px;
          background: #ffffff;
        }
        
        .hex-value {
          font-size: 16px;
          font-weight: bold;
          font-family: Monaco, Consolas, monospace;
          color: #333;
          margin-bottom: 3px;
        }
        
        .rgb-value {
          font-size: 10px;
          color: #666;
          margin-bottom: 8px;
        }
        
        .instructions {
          font-size: 9px;
          color: #888;
          line-height: 1.2;
        }
        
        .debug {
          position: absolute;
          top: 2px;
          left: 2px;
          font-size: 8px;
          color: #fff;
          background: rgba(0,0,0,0.7);
          padding: 1px 3px;
          border-radius: 2px;
        }
      </style>
    </head>
    <body>
      <div class="magnifier-container">
        <div class="debug" id="debugInfo">Ready</div>
        <div class="magnifier-circle">
          <div class="pixel-grid" id="pixelGrid"></div>
        </div>
        
        <div class="color-info">
          <div class="color-preview" id="colorPreview"></div>
          <div class="hex-value" id="hexValue">#FFFFFF</div>
          <div class="rgb-value" id="rgbValue">RGB(255, 255, 255)</div>
          <div class="instructions">
            Click to select • ESC to cancel
          </div>
        </div>
      </div>
      
      <script>
        const { ipcRenderer } = require('electron');
        
        const pixelGrid = document.getElementById('pixelGrid');
        const colorPreview = document.getElementById('colorPreview');
        const hexValue = document.getElementById('hexValue');
        const rgbValue = document.getElementById('rgbValue');
        const debugInfo = document.getElementById('debugInfo');
        
        console.log('[Magnifier] Script loaded');
        
        // Create 9x9 grid of pixels (81 total)
        function createPixelGrid() {
          pixelGrid.innerHTML = '';
          for (let i = 0; i < 81; i++) {
            const pixel = document.createElement('div');
            pixel.className = 'pixel';
            pixel.id = \`pixel-\${i}\`;
            
            // Center pixel is at position 40 (5th row, 5th column in 0-indexed 9x9 grid: 4*9+4 = 40)
            if (i === 40) {
              pixel.className += ' center';
            }
            
            pixelGrid.appendChild(pixel);
          }
        }
        
        createPixelGrid();
        
        // Signal ready
        ipcRenderer.send('magnifier-ready');
        
        let updateCount = 0;
        
        // Listen for pixel grid updates
        ipcRenderer.on('update-pixel-grid', (event, data) => {
          try {
            updateCount++;
            debugInfo.textContent = \`Updates: \${updateCount}\`;
            
            // Update center color info
            const centerColor = data.centerColor;
            colorPreview.style.backgroundColor = centerColor.hex;
            hexValue.textContent = centerColor.hex.toUpperCase();
            rgbValue.textContent = \`RGB(\${centerColor.r}, \${centerColor.g}, \${centerColor.b})\`;
            
            // Update pixel grid with surrounding colors
            if (data.pixels && data.pixels.length === 9) {
              let pixelIndex = 0;
              for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                  const pixel = document.getElementById(\`pixel-\${pixelIndex}\`);
                  if (pixel && data.pixels[row] && data.pixels[row][col]) {
                    pixel.style.backgroundColor = data.pixels[row][col].hex;
                  }
                  pixelIndex++;
                }
              }
            }
            
          } catch (error) {
            console.error('[Magnifier] Error updating grid:', error);
            debugInfo.textContent = 'Error: ' + error.message;
          }
        });
        
        // Handle clicks
        document.addEventListener('click', (e) => {
          console.log('[Magnifier] Click detected');
          ipcRenderer.send('color-selected');
        });
        
        // Handle escape
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            ipcRenderer.send('picker-cancelled');
          }
        });
        
        window.focus();
      </script>
    </body>
    </html>`;

    await this.magnifierWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`
    );
    this.magnifierWindow.show();

    console.log('[Magnifying Color Picker] Magnifier window created and shown');

    // Start cursor tracking immediately
    setTimeout(() => {
      console.log(
        '[Magnifying Color Picker] 🚀 Starting fluid cursor tracking...'
      );
      this.startCursorTracking(() => {});
    }, 100);
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
    // The center square is at grid position [4][4] (middle of 9x9 grid)
    // Each grid cell is 200px / 9 = 22.22px
    // Center square is at (4 * 22.22 + 11.11) = 100px from grid edge
    // Grid starts at 10px from window edge, so center is at 110px from window edge
    const newX = cursorPos.x - 110; // Position so center square is on cursor
    const newY = cursorPos.y - 110; // Position so center square is on cursor

    // Basic bounds checking
    const currentDisplay = screen.getDisplayNearestPoint(cursorPos);
    const bounds = currentDisplay.bounds;

    const adjustedX = Math.max(
      bounds.x - 50,
      Math.min(newX, bounds.x + bounds.width - 170)
    );
    const adjustedY = Math.max(
      bounds.y - 50,
      Math.min(newY, bounds.y + bounds.height - 270)
    );

    this.magnifierWindow.setPosition(adjustedX, adjustedY);
  }

  private capturePixelGrid(
    cursorPos: { x: number; y: number },
    onColorChange: (color: string) => void
  ): void {
    try {
      const monitor = screenshots.Monitor.fromPoint(cursorPos.x, cursorPos.y);
      if (!monitor) return;

      // Capture 9x9 area around cursor for the grid
      const gridSize = 9;
      const halfSize = Math.floor(gridSize / 2); // halfSize = 4

      const monitorX = cursorPos.x - monitor.x;
      const monitorY = cursorPos.y - monitor.y;

      console.log(
        `[Debug] Cursor: (${cursorPos.x}, ${cursorPos.y}), Monitor: (${monitorX}, ${monitorY})`
      );

      // Calculate capture area with bounds checking
      const startX = Math.max(
        0,
        Math.min(monitorX - halfSize, monitor.width - gridSize)
      );
      const startY = Math.max(
        0,
        Math.min(monitorY - halfSize, monitor.height - gridSize)
      );

      console.log(
        `[Debug] Capturing from (${startX}, ${startY}) size ${gridSize}x${gridSize}`
      );

      // Capture the grid area
      const fullImage = monitor.captureImageSync();
      const gridImage = fullImage.cropSync(startX, startY, gridSize, gridSize);
      const rawData = gridImage.toRawSync();

      // Convert to 2D array of colors
      const pixels: ColorInfo[][] = [];
      for (let row = 0; row < gridSize; row++) {
        pixels[row] = [];
        for (let col = 0; col < gridSize; col++) {
          const pixelIndex = (row * gridSize + col) * 4;
          const r = rawData[pixelIndex] || 0;
          const g = rawData[pixelIndex + 1] || 0;
          const b = rawData[pixelIndex + 2] || 0;
          const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          pixels[row]![col] = { hex, r, g, b };
        }
      }

      // Center pixel is at [4][4] in a 9x9 grid (middle position)
      const centerColor = pixels[4]?.[4];
      if (centerColor) {
        console.log(`[Debug] Center pixel color: ${centerColor.hex}`);
        onColorChange(centerColor.hex);

        // Send to renderer
        if (this.magnifierWindow && !this.magnifierWindow.isDestroyed()) {
          this.magnifierWindow.webContents.send('update-pixel-grid', {
            centerColor,
            pixels,
            cursorPos,
          });
        }
      }
    } catch (error) {
      console.warn('[Magnifying Color Picker] Capture error:', error);
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
    mb.hideWindow();

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

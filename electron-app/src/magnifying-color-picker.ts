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
  private cachedScreenshot: { image: any; rawData: Uint8Array; monitor: any } | null = null;

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
      monitor: monitor
    };
    
    console.log(`[Magnifying Color Picker] Cached screenshot: ${fullImage.width}x${fullImage.height}`);
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
           border: 3px solid #ffffff;
           box-shadow: 0 0 6px #000000, inset 0 0 4px rgba(255, 255, 255, 0.8);
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
      // Use cached screenshot instead of taking a new one!
      if (!this.cachedScreenshot) {
        console.warn('[Debug] No cached screenshot available');
        return;
      }

      const { image: fullImage, rawData: rawImageData, monitor } = this.cachedScreenshot;
      
      // Calculate cursor position in image coordinates using the cached monitor info
      const monitorX = cursorPos.x - monitor.x;
      const monitorY = cursorPos.y - monitor.y;
      
      // Simple scaling: image size / monitor size
      const scaleX = fullImage.width / monitor.width;
      const scaleY = fullImage.height / monitor.height;
      
      const imageX = Math.floor(monitorX * scaleX);
      const imageY = Math.floor(monitorY * scaleY);
      
      console.log(`[Debug] Using cached screenshot - Cursor: (${cursorPos.x}, ${cursorPos.y}) -> Image: (${imageX}, ${imageY})`);

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
          pixels[row]![col] = pixelColor || { hex: '#808080', r: 128, g: 128, b: 128 }; // Gray fallback
        }
      }

      // Send to renderer
      if (this.magnifierWindow && !this.magnifierWindow.isDestroyed()) {
        this.magnifierWindow.webContents.send('update-pixel-grid', {
          centerColor,
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

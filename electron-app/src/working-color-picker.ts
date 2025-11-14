import { BrowserWindow, globalShortcut, ipcMain, screen } from 'electron';
import { type Menubar } from 'menubar';
import * as screenshots from 'node-screenshots';

class WorkingColorPicker {
  private overlayWindow: BrowserWindow | null = null;
  private positionInterval: NodeJS.Timeout | null = null;

  async pickColor(): Promise<string | null> {
    console.log('[Working Color Picker] Starting...');

    try {
      await this.createOverlay();
      return await this.startPicking();
    } catch (error) {
      console.error('[Working Color Picker] Error:', error);
      return null;
    } finally {
      this.cleanup();
    }
  }

  private async createOverlay(): Promise<void> {
    const primaryDisplay = screen.getPrimaryDisplay();

    this.overlayWindow = new BrowserWindow({
      width: 300,
      height: 150,
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

    // Center on screen
    this.overlayWindow.setPosition(
      Math.floor(primaryDisplay.workAreaSize.width / 2) - 150,
      Math.floor(primaryDisplay.workAreaSize.height / 2) - 75
    );

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 20px;
          background: rgba(255, 255, 255, 0.95);
          border: 3px solid #007AFF;
          border-radius: 12px;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          text-align: center;
          cursor: crosshair;
          user-select: none;
        }
        .title {
          font-size: 18px;
          font-weight: bold;
          color: #007AFF;
          margin-bottom: 10px;
        }
        .instructions {
          font-size: 14px;
          color: #666;
          margin-bottom: 15px;
        }
        .color-display {
          width: 60px;
          height: 40px;
          border: 2px solid #333;
          border-radius: 8px;
          margin: 10px auto;
          background: #ffffff;
        }
        .color-text {
          font-family: Monaco, monospace;
          font-size: 16px;
          font-weight: bold;
          color: #333;
        }
      </style>
    </head>
    <body>
      <div class="title">Custom Color Picker</div>
      <div class="instructions">Move mouse • Click to pick • ESC to cancel</div>
      <div class="color-display" id="colorBox"></div>
      <div class="color-text" id="colorText">#FFFFFF</div>
      
      <script>
        const { ipcRenderer } = require('electron');
        
        console.log('[Overlay] Script loaded');
        
        // Signal that overlay is ready
        ipcRenderer.send('overlay-ready');
        
        // Listen for color updates
        ipcRenderer.on('update-color', (event, hex) => {
          const colorBox = document.getElementById('colorBox');
          const colorText = document.getElementById('colorText');
          if (colorBox && colorText) {
            colorBox.style.backgroundColor = hex;
            colorText.textContent = hex;
          }
        });
        
        // Handle clicks
        document.addEventListener('click', (e) => {
          console.log('[Overlay] Click detected');
          ipcRenderer.send('color-selected');
        });
        
        // Handle escape key
        document.addEventListener('keydown', (e) => {
          console.log('[Overlay] Key pressed:', e.key);
          if (e.key === 'Escape') {
            ipcRenderer.send('picker-cancelled');
          }
        });
        
        // Focus the window so it can receive key events
        window.focus();
      </script>
    </body>
    </html>`;

    await this.overlayWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`
    );
    this.overlayWindow.show();
    this.overlayWindow.focus();

    console.log('[Working Color Picker] Overlay window created and shown');
  }

  private async startPicking(): Promise<string | null> {
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
        console.log(
          '[Working Color Picker] Overlay ready, starting mouse tracking'
        );
        this.startMouseTracking();
        this.startColorTracking((color) => {
          currentColor = color;
        });
      };

      const handleColorSelected = () => {
        console.log('[Working Color Picker] Color selected:', currentColor);
        resolveOnce(currentColor);
      };

      const handleCancelled = () => {
        console.log('[Working Color Picker] Picker cancelled');
        resolveOnce(null);
      };

      // Register IPC handlers
      ipcMain.once('overlay-ready', handleReady);
      ipcMain.once('color-selected', handleColorSelected);
      ipcMain.once('picker-cancelled', handleCancelled);

      // Register global escape key
      globalShortcut.register('Escape', () => {
        console.log('[Working Color Picker] Global escape pressed');
        resolveOnce(null);
      });

      // Color tracking will be started in handleReady

      // Timeout after 30 seconds
      setTimeout(() => {
        resolveOnce(null);
      }, 30000);
    });
  }

  private startMouseTracking(): void {
    this.positionInterval = setInterval(() => {
      if (!this.overlayWindow || this.overlayWindow.isDestroyed()) {
        return;
      }

      const cursorPos = screen.getCursorScreenPoint();

      // Position overlay away from cursor
      const offset = 100;
      const newX = cursorPos.x + offset;
      const newY = cursorPos.y - offset;

      this.overlayWindow.setPosition(newX, newY);
    }, 50);
  }

  private startColorTracking(onColorChange: (color: string) => void): void {
    const colorInterval = setInterval(() => {
      if (!this.overlayWindow || this.overlayWindow.isDestroyed()) {
        clearInterval(colorInterval);
        return;
      }

      try {
        const cursorPos = screen.getCursorScreenPoint();
        const color = this.getColorAtPosition(cursorPos.x, cursorPos.y);

        if (color) {
          onColorChange(color);
          this.overlayWindow.webContents.send('update-color', color);
        }
      } catch (error) {
        // Silently handle color reading errors
      }
    }, 100);
  }

  private getColorAtPosition(x: number, y: number): string | null {
    try {
      const monitor = screenshots.Monitor.fromPoint(x, y);
      if (!monitor) return null;

      // Capture full monitor image
      const fullImage = monitor.captureImageSync();

      // Convert coordinates to monitor-relative coordinates
      const monitorX = x - monitor.x;
      const monitorY = y - monitor.y;

      // Crop to get 1x1 pixel at the cursor position
      const pixelImage = fullImage.cropSync(monitorX, monitorY, 1, 1);

      const rawData = pixelImage.toRawSync();
      const r = rawData[0] || 0;
      const g = rawData[1] || 0;
      const b = rawData[2] || 0;

      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch (error) {
      console.warn('[Working Color Picker] Error getting color:', error);
      return null;
    }
  }

  private cleanup(): void {
    if (this.positionInterval) {
      clearInterval(this.positionInterval);
      this.positionInterval = null;
    }

    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.close();
      this.overlayWindow = null;
    }

    // Clean up IPC listeners
    ipcMain.removeAllListeners('overlay-ready');
    ipcMain.removeAllListeners('color-selected');
    ipcMain.removeAllListeners('picker-cancelled');

    // Unregister shortcuts
    globalShortcut.unregister('Escape');

    console.log('[Working Color Picker] Cleanup completed');
  }
}

async function launchWorkingColorPicker(
  mb: Menubar,
  type = 'global'
): Promise<void> {
  const picker = new WorkingColorPicker();

  try {
    mb.hideWindow();

    const color = await picker.pickColor();

    if (color) {
      console.log('[Working Color Picker] Final result:', color);

      if (type === 'global') {
        mb.window!.webContents.send('changeColor', color);
      }
      if (type === 'contrastBg') {
        mb.window!.webContents.send('pickContrastBgColor', color);
      }
      if (type === 'contrastFg') {
        mb.window!.webContents.send('pickContrastFgColor', color);
      }
    } else {
      console.log('[Working Color Picker] No color selected');
    }
  } finally {
    void mb.showWindow();
  }
}

export { launchWorkingColorPicker };

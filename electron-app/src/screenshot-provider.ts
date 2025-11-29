import { exec } from 'node:child_process';
import { unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { app, nativeImage, screen } from 'electron';

const execAsync = promisify(exec);

interface ScreenshotResult {
  width: number;
  height: number;
  rawData: Uint8Array;
  dataURL: string;
  monitorInfo: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface NodeScreenshotsMonitor {
  x: number;
  y: number;
  width: number;
  height: number;
  captureImageSync: () => {
    width: number;
    height: number;
    toRawSync: () => Uint8Array;
  };
}

interface NodeScreenshotsModule {
  Monitor: {
    fromPoint: (x: number, y: number) => NodeScreenshotsMonitor | null;
  };
}

let nodeScreenshots: NodeScreenshotsModule | null = null;
let fallbackMode = false;

// Try to load node-screenshots, fall back to shell commands if not available
try {
  // Dynamic import to allow graceful fallback
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  nodeScreenshots = require('node-screenshots') as NodeScreenshotsModule;
  console.log('[Screenshot Provider] Using node-screenshots');
} catch {
  console.log(
    '[Screenshot Provider] node-screenshots not available, using fallback'
  );
  fallbackMode = true;
}

async function captureScreenshotWithFallback(): Promise<ScreenshotResult> {
  if (!fallbackMode && nodeScreenshots) {
    return captureWithNodeScreenshots();
  }

  return captureWithShellCommands();
}

function captureWithNodeScreenshots(): ScreenshotResult {
  if (!nodeScreenshots) {
    throw new Error('node-screenshots not available');
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const centerX = Math.floor(primaryDisplay.workAreaSize.width / 2);
  const centerY = Math.floor(primaryDisplay.workAreaSize.height / 2);

  const monitor = nodeScreenshots.Monitor.fromPoint(centerX, centerY);
  if (!monitor) {
    throw new Error('No monitor found for initial screenshot');
  }

  const fullImage = monitor.captureImageSync();
  const rawImageData = fullImage.toRawSync();

  // Create a nativeImage from raw data and convert to data URL
  const image = nativeImage.createFromBuffer(Buffer.from(rawImageData), {
    width: fullImage.width,
    height: fullImage.height,
  });
  const dataURL = image.toDataURL();

  return {
    width: fullImage.width,
    height: fullImage.height,
    rawData: rawImageData,
    dataURL,
    monitorInfo: {
      x: monitor.x,
      y: monitor.y,
      width: monitor.width,
      height: monitor.height,
    },
  };
}

async function tryScreenshotCommand(tempFile: string): Promise<void> {
  // Try gnome-screenshot first (works on both X11 and Wayland GNOME)
  try {
    console.log('[Screenshot Provider] Trying gnome-screenshot...');
    await execAsync(`gnome-screenshot -f "${tempFile}"`);
    // Verify the file was actually created
    const fs = await import('node:fs');
    if (!fs.existsSync(tempFile)) {
      throw new Error('gnome-screenshot did not create the file');
    }
    console.log('[Screenshot Provider] gnome-screenshot succeeded');
    return;
  } catch (err) {
    console.log('[Screenshot Provider] gnome-screenshot not available:', err);
  }

  // Try grim (Wayland-native, works on wlroots-based compositors)
  try {
    console.log('[Screenshot Provider] Trying grim...');
    await execAsync(`grim "${tempFile}"`);
    console.log('[Screenshot Provider] grim succeeded');
    return;
  } catch (err) {
    console.log('[Screenshot Provider] grim not available:', err);
  }

  // Try spectacle (KDE screenshot tool, works on both X11 and Wayland)
  try {
    console.log('[Screenshot Provider] Trying spectacle...');
    await execAsync(`spectacle -b -n -o "${tempFile}"`);
    console.log('[Screenshot Provider] spectacle succeeded');
    return;
  } catch (err) {
    console.log('[Screenshot Provider] spectacle not available:', err);
  }

  // Try scrot (X11 only - won't work on Wayland)
  try {
    console.log('[Screenshot Provider] Trying scrot...');
    await execAsync(`scrot "${tempFile}"`);
    console.log('[Screenshot Provider] scrot succeeded');
    return;
  } catch (err) {
    console.log('[Screenshot Provider] scrot not available:', err);
  }

  // Try import from ImageMagick (X11 only)
  try {
    console.log('[Screenshot Provider] Trying import (ImageMagick)...');
    await execAsync(`import -window root "${tempFile}"`);
    console.log('[Screenshot Provider] import succeeded');
    return;
  } catch (err) {
    console.log('[Screenshot Provider] import not available:', err);
  }

  throw new Error(
    'No screenshot tool available. Please install one of: gnome-screenshot (GNOME), grim (Wayland), spectacle (KDE), scrot (X11), or imagemagick (X11)'
  );
}

async function captureWithShellCommands(): Promise<ScreenshotResult> {
  const tempFile = join(
    app.getPath('temp'),
    `swach-screenshot-${Date.now()}.png`
  );

  console.log('[Screenshot Provider] Capturing with shell commands...');
  console.log('[Screenshot Provider] Temp file:', tempFile);

  try {
    await tryScreenshotCommand(tempFile);
    console.log('[Screenshot Provider] Screenshot captured successfully');

    // Read the PNG file using Electron's nativeImage
    const image = nativeImage.createFromPath(tempFile);
    if (image.isEmpty()) {
      throw new Error('Failed to load screenshot image');
    }

    const size = image.getSize();
    console.log(
      `[Screenshot Provider] Image size: ${size.width}x${size.height}`
    );

    // Get data URL from the image (this preserves the original PNG)
    const dataURL = image.toDataURL();
    console.log(`[Screenshot Provider] Data URL length: ${dataURL.length}`);
    console.log(
      `[Screenshot Provider] Data URL starts with: ${dataURL.substring(0, 50)}`
    );

    // Get raw BGRA bitmap data (Electron uses BGRA format)
    const bitmap = image.toBitmap();
    console.log(`[Screenshot Provider] Bitmap size: ${bitmap.length} bytes`);

    // Convert BGRA to RGBA for pixel reading
    const rawData = new Uint8Array(bitmap.length);
    for (let i = 0; i < bitmap.length; i += 4) {
      rawData[i] = bitmap[i + 2]!; // R <- B
      rawData[i + 1] = bitmap[i + 1]!; // G <- G
      rawData[i + 2] = bitmap[i]!; // B <- R
      rawData[i + 3] = bitmap[i + 3]!; // A <- A
    }

    // Get monitor info from Electron's screen API
    const primaryDisplay = screen.getPrimaryDisplay();
    console.log(
      '[Screenshot Provider] Primary display:',
      primaryDisplay.bounds
    );

    return {
      width: size.width,
      height: size.height,
      rawData,
      dataURL,
      monitorInfo: {
        x: primaryDisplay.bounds.x,
        y: primaryDisplay.bounds.y,
        width: primaryDisplay.bounds.width,
        height: primaryDisplay.bounds.height,
      },
    };
  } catch (error) {
    console.error('[Screenshot Provider] Error capturing screenshot:', error);
    throw error;
  } finally {
    // Clean up temp file
    try {
      unlinkSync(tempFile);
      console.log('[Screenshot Provider] Temp file cleaned up');
    } catch {
      // Ignore cleanup errors
    }
  }
}

export { captureScreenshotWithFallback, type ScreenshotResult };

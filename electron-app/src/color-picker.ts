import { colornames } from 'color-name-list';
import { ColorPicker } from 'hue-hunter';
import { type Menubar } from 'menubar';
import nearestColor from 'nearest-color';

// Setup color name lookup function once
const namedColors = colornames.reduce(
  (
    o: { [key: string]: string },
    { name, hex }: { name: string; hex: string }
  ) => Object.assign(o, { [name]: hex }),
  {}
);
const getColorName = nearestColor.from(namedColors);

// Create ColorPicker instance with color naming
const picker = new ColorPicker({
  colorNameFn: (rgb) => getColorName(rgb).name,
  initialDiameter: 180,
  initialSquareSize: 20,
});

async function launchPicker(mb: Menubar, type = 'global') {
  try {
    // Hide window and wait for it to be fully hidden
    if (mb.window && !mb.window.isDestroyed()) {
      const hidePromise = new Promise<void>((resolve) => {
        if (mb.window?.isVisible()) {
          mb.window?.once('hide', () => resolve());
          mb.hideWindow();
        } else {
          resolve();
        }
      });
      await hidePromise;
    } else {
      mb.hideWindow();
    }

    // Launch the color picker
    const color = await picker.pickColor();

    // Send the selected color to the renderer if one was chosen
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
  } catch (error) {
    console.error('[Color Picker] Failed to launch:', error);
  } finally {
    void mb.showWindow();
  }
}

export { launchPicker };

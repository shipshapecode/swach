const { TouchBar } = require('electron');
const { debounce } = require('throttle-debounce');
const { TouchBarButton, TouchBarColorPicker, TouchBarGroup } = TouchBar;

function setTouchbar(mb, itemsToShow) {
  if (process.platform === 'darwin') {
    if (itemsToShow) {
      const items = [];

      if (itemsToShow.colorPicker) {
        const colorPicker = new TouchBarColorPicker({
          change: debounce(250, (color) => {
            mb.window.webContents.send('updateKulerColor', color);
          }),
        });

        items.push(colorPicker);
      }

      if (itemsToShow.kulerColors) {
        const colors = itemsToShow.kulerColors.colors;
        const colorButtons = colors.map((color) => {
          return new TouchBarButton({
            backgroundColor: color.hex,
            label: color.hex,
            click() {
              mb.window.webContents.send(
                'selectKulerColor',
                itemsToShow.kulerColors.colors.indexOf(color),
              );
            },
          });
        });
        const kulerColors = new TouchBarGroup({
          items: new TouchBar({ items: colorButtons }),
        });

        items.push(kulerColors);
      }

      const touchBar = new TouchBar({
        items,
      });

      mb.window.setTouchBar(touchBar);
    } else {
      mb.window.setTouchBar(null);
    }
  }
}

module.exports = {
  setTouchbar,
};

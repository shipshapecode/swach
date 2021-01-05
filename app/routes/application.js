import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

import { clone } from '@orbit/utils';

import ENV from 'swach/config/environment';

export default class ApplicationRoute extends Route {
  @service dataCoordinator;
  @service router;
  @service store;

  constructor() {
    super(...arguments);

    if (typeof requireNode !== 'undefined') {
      let { ipcRenderer } = requireNode('electron');
      this.ipcRenderer = ipcRenderer;

      this.router.on('routeDidChange', () => {
        this.ipcRenderer.send('setTouchbar', []);
      });
    }
  }

  async beforeModel() {
    if (ENV.environment === 'test') {
      this.dataCoordinator.removeStrategy('store-backup-sync');
      this.dataCoordinator.removeSource('backup');
    } else {
      const backup = this.dataCoordinator.getSource('backup');

      if (backup) {
        const transform = await backup.pull((q) => q.findRecords());
        await this.store.sync(transform);
      }
    }

    await this.dataCoordinator.activate();

    const palettes = await this.store.find('palette');
    let colorHistory = palettes.findBy('isColorHistory', true);

    if (!colorHistory) {
      colorHistory = await this.store.addRecord({
        type: 'palette',
        createdAt: new Date(),
        colorOrder: [],
        isColorHistory: true,
        isFavorite: false,
        isLocked: false
      });
    } else {
      await this.ensureSinglePalettePerColor();
      await this.migratePalettesToPalette();
    }
  }

  async ensureSinglePalettePerColor() {
    const colors = await this.store.findRecords('color');
    await this.store.update((t) => {
      const operations = [];
      for (const color of colors) {
        // If the color exists in more than one palette, we should copy it for all the other palettes
        if (color.palettes?.length ?? 0 > 1) {
          // We start at i = 1 because we can keep the original color in a single palette.
          for (let i = 1; i < color.palettes.length; i++) {
            const palette = color.palettes[i];
            const colorCopy = clone(color.getData());
            delete colorCopy.id;
            delete colorCopy.relationships;

            const colorsList = palette.colors.map((color) => {
              return { type: 'color', id: color.id };
            });
            const colorsListRecord = colorsList.findBy('id', color.id);
            if (colorsListRecord) {
              const colorToRemoveIndex = colorsList.indexOf(colorsListRecord);
              colorsList.removeAt(colorToRemoveIndex);

              const addColorOperation = t.addRecord(colorCopy);
              const colorCopyRecord = {
                type: 'color',
                id: addColorOperation.operation.record.id
              };
              colorsList.insertAt(colorToRemoveIndex, colorCopyRecord);

              operations.push(addColorOperation);
              operations.push(
                t.replaceRelatedRecords(
                  { type: 'palette', id: palette.id },
                  'colors',
                  colorsList
                )
              );
              operations.push(
                t.replaceAttribute(
                  { type: 'palette', id: palette.id },
                  'colorOrder',
                  colorsList
                )
              );
            }
          }

          operations.push(
            t.replaceRelatedRecords(color, 'palettes', [
              { type: 'palette', id: color.palettes[0].id }
            ])
          );
        }
      }

      return operations;
    });
  }

  async migratePalettesToPalette() {
    const colors = await this.store.findRecords('color');
    await this.store.update((t) => {
      const operations = [];
      for (const color of colors) {
        if (color.palettes) {
          const rawColorData = color.getData();
          rawColorData.relationships.palette = {
            data: rawColorData.relationships.palettes.data[0]
          };
          // delete rawColorData.relationships.palettes;
          operations.push(t.updateRecord(rawColorData));
        }
      }

      return operations;
    });
  }
}

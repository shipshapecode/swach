import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

import { clone } from '@orbit/utils';

import ENV from 'swach/config/environment';

export default class ApplicationRoute extends Route {
  @service dataCoordinator;
  @service dataSchema;
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
        let colorTransforms = await backup.pull((q) => q.findRecords('color'));
        const paletteTransforms = await backup.pull((q) =>
          q.findRecords('palette')
        );
        colorTransforms[0].operations = colorTransforms[0].operations.flatMap(
          (colorOp) => {
            const colorRecord = colorOp?.record;
            const palettesRelationships =
              colorRecord?.relationships?.palettes?.data;
            if (palettesRelationships?.length ?? 0 > 1) {
              colorOp.record.relationships.palettes.data = [
                palettesRelationships[0]
              ];
              const createColorOps = [colorOp];
              // We start at i = 1 because we can keep the original color in a single palette.
              for (let i = 1; i < palettesRelationships.length; i++) {
                const palette = palettesRelationships[i];
                const colorCopy = clone(colorRecord);
                colorCopy.id = this.dataSchema.generateId('color');
                colorCopy.relationships.palettes.data = [palette];

                const paletteOp = paletteTransforms[0].operations.find(
                  (op) => op.record.id === palette.id
                );

                if (paletteOp) {
                  const replaceColorIdWithCopy = (color) => {
                    return color.id !== colorRecord.id
                      ? color
                      : { type: 'color', id: colorCopy.id };
                  };
                  // Replace color in palette with color copy
                  paletteOp.record.relationships.colors.data = paletteOp.record.relationships.colors.data.map(
                    replaceColorIdWithCopy
                  );

                  // Replace color id in colorOrder
                  paletteOp.record.attributes.colorOrder = paletteOp.record.attributes.colorOrder.map(
                    replaceColorIdWithCopy
                  );
                }

                createColorOps.push({ op: 'addRecord', record: colorCopy });
              }
              return createColorOps;
            } else {
              return colorOp;
            }
          }
        );
        colorTransforms[0].operations = [
          ...colorTransforms[0].operations,
          ...paletteTransforms[0].operations
        ];
        await this.store.sync(colorTransforms);
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
    }
  }

  // async migratePalettesToPalette() {
  //   const colors = await this.store.findRecords('color');
  //   await this.store.update((t) => {
  //     const operations = [];
  //     for (const color of colors) {
  //       if (color.palettes) {
  //         const rawColorData = color.getData();
  //         debugger;
  //         rawColorData.relationships.palette = {
  //           data: rawColorData.relationships.palettes.data[0]
  //         };
  //         // delete rawColorData.relationships.palettes;
  //         operations.push(t.updateRecord(rawColorData));
  //       }
  //     }

  //     return operations;
  //   });
  // }
}

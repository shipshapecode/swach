import colors from 'swach/tests/orbit/fixtures/colors';
import colorHistoryColors from 'swach/tests/orbit/fixtures/colors/color-history';
import firstPaletteColors from 'swach/tests/orbit/fixtures/colors/first-palette';
import lockedPaletteColors from 'swach/tests/orbit/fixtures/colors/locked-palette';
import secondPaletteColors from 'swach/tests/orbit/fixtures/colors/second-palette';
import palettes from 'swach/tests/orbit/fixtures/palettes';

export default async function seedOrbit(source, scenario = 'basic') {
  if (scenario === 'basic') {
    await source.update((t) => {
      const operations = [];

      colors.forEach((color) => {
        operations.push(t.addRecord(color));
      });

      palettes.forEach((palette) => {
        operations.push(t.addRecord(palette));

        const { id } = palette;
        if (id === 'color-history-123') {
          const ids = [];
          colorHistoryColors.forEach((color) => {
            color.id ??= source.schema.generateId('color');
            ids.push(color.id);
            operations.push(t.addRecord(color));
          });

          operations.push(
            t.replaceRelatedRecords(
              { type: 'palette', id: 'color-history-123' },
              'colors',
              ids.map((id) => {
                return {
                  type: 'color',
                  id,
                };
              }),
            ),
          );
        } else if (id === 'first-palette') {
          const ids = [];
          firstPaletteColors.forEach((color) => {
            color.id ??= source.schema.generateId('color');
            ids.push(color.id);
            operations.push(t.addRecord(color));
          });
          const colorsList = ids.map((id) => {
            return {
              type: 'color',
              id,
            };
          });

          operations.push(
            t.replaceRelatedRecords(
              { type: 'palette', id: 'first-palette' },
              'colors',
              colorsList,
            ),
          );

          operations.push(
            t.replaceAttribute(
              { type: 'palette', id: 'first-palette' },
              'colorOrder',
              colorsList,
            ),
          );
        } else if (id === 'second-palette') {
          const ids = [];
          secondPaletteColors.forEach((color) => {
            color.id ??= source.schema.generateId('color');
            ids.push(color.id);
            operations.push(t.addRecord(color));
          });
          const colorsList = ids.map((id) => {
            return {
              type: 'color',
              id,
            };
          });
          operations.push(
            t.replaceRelatedRecords(
              { type: 'palette', id: 'second-palette' },
              'colors',
              colorsList,
            ),
          );

          operations.push(
            t.replaceAttribute(
              { type: 'palette', id: 'second-palette' },
              'colorOrder',
              colorsList,
            ),
          );
        } else if (id === 'locked-palette') {
          const ids = [];
          lockedPaletteColors.forEach((color) => {
            color.id ??= source.schema.generateId('color');
            ids.push(color.id);
            operations.push(t.addRecord(color));
          });
          const colorsList = ids.map((id) => {
            return {
              type: 'color',
              id,
            };
          });
          operations.push(
            t.replaceRelatedRecords(
              { type: 'palette', id: 'locked-palette' },
              'colors',
              colorsList,
            ),
          );

          operations.push(
            t.replaceAttribute(
              { type: 'palette', id: 'locked-palette' },
              'colorOrder',
              colorsList,
            ),
          );
        }
      });

      return operations;
    });
  }
}

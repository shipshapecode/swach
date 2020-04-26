import colors from './fixtures/colors';
import palettes from './fixtures/palettes';

export default async function seedOrbit(owner) {
  const store = owner.lookup('service:store');

  await store.update((t) => {
    const operations = [];

    colors.forEach((color) => {
      operations.push(t.addRecord(color));
    });

    palettes.forEach((palette) => {
      operations.push(t.addRecord(palette));

      const { id } = palette;
      if (id === 'color-history-123') {
        operations.push(
          t.replaceRelatedRecords(
            { type: 'palette', id: 'color-history-123' },
            'colors',
            [
              { type: 'color', id: 'black' },
              { type: 'color', id: 'pale-magenta' },
              { type: 'color', id: 'shamrock' },
              { type: 'color', id: 'white' }
            ]
          )
        );
      } else if (id === 'first-palette') {
        const colorsList = [
          { type: 'color', id: 'black' },
          { type: 'color', id: 'denim' },
          { type: 'color', id: 'inch-worm' },
          { type: 'color', id: 'white' }
        ];
        operations.push(
          t.replaceRelatedRecords(
            { type: 'palette', id: 'first-palette' },
            'colors',
            colorsList
          )
        );

        operations.push(
          t.replaceAttribute(
            { type: 'palette', id: 'first-palette' },
            'colorOrder',
            colorsList
          )
        );
      } else if (id === 'second-palette') {
        const colorsList = [
          { type: 'color', id: 'black' },
          { type: 'color', id: 'white' }
        ];
        operations.push(
          t.replaceRelatedRecords(
            { type: 'palette', id: 'second-palette' },
            'colors',
            colorsList
          )
        );

        operations.push(
          t.replaceAttribute(
            { type: 'palette', id: 'second-palette' },
            'colorOrder',
            colorsList
          )
        );
      } else if (id === 'locked-palette') {
        const colorsList = [
          { type: 'color', id: 'black' },
          { type: 'color', id: 'shamrock' },
          { type: 'color', id: 'white' }
        ];
        operations.push(
          t.replaceRelatedRecords(
            { type: 'palette', id: 'locked-palette' },
            'colors',
            colorsList
          )
        );

        operations.push(
          t.replaceAttribute(
            { type: 'palette', id: 'locked-palette' },
            'colorOrder',
            colorsList
          )
        );
      }
    });

    return operations;
  });
}

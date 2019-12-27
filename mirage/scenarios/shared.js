export default function(server) {
  /*
    Seed your development database using your factories.
    This data will not be loaded in your tests.
  */

  // server.createList('post', 10);

  const black = server.create('color', { hex: '#000000', name: 'Black' });
  const denim = server.create('color', { hex: '#356dc4', name: 'Denim' });
  const inchWorm = server.create('color', {
    hex: '#b0f566',
    name: 'Inch Worm'
  });
  const paleMagenta = server.create('color', {
    id: 'color-1',
    hex: '#f78ae0',
    name: 'Pale Magenta'
  });
  const shamrock = server.create('color', {
    hex: '#4af2a1',
    name: 'Shamrock'
  });
  const white = server.create('color', { hex: '#ffffff', name: 'White' });

  const colorHistoryPalette = server.create('palette', {
    id: 'color-history-123',
    isColorHistory: true
  });
  colorHistoryPalette.update('colors', [black, paleMagenta, shamrock, white]);

  const firstPalette = server.create('palette', { name: 'First Palette' });
  firstPalette.update('colors', [black, denim, inchWorm, white]);

  const secondPalette = server.create('palette', { name: 'Second Palette' });
  secondPalette.update('colors', [black, white]);
}

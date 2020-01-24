export default function() {
  // These comments are here to help you get started. Feel free to delete them.

  /*
    Config (with defaults).

    Note: these only affect routes defined *after* them!
  */

  // this.logging = true;
  // this.urlPrefix = '';    // make this `http://localhost:8080`, for example, if your API is on a different server
  // this.namespace = '';    // make this `/api`, for example, if your API is namespaced
  // this.timing = 400;      // delay for each request, automatically set to 0 during testing

  /*
    Shorthand cheatsheet:

    this.get('/posts');
    this.post('/posts');
    this.get('/posts/:id');
    this.put('/posts/:id'); // or this.patch
    this.del('/posts/:id');

    https://www.ember-cli-mirage.com/docs/route-handlers/shorthands
  */

  this.get('/colors');
  this.get('/colors/:id');
  this.patch('/colors/:id');
  this.del('/colors/:id');

  this.get('/palettes');
  this.get('/palettes/:id');
  this.patch('/palettes/:id');
  this.del('/palettes/:id');

  // Relationship urls for Orbit
  this.del('/colors/:id/relationships/palettes', function(schema, request) {
    const attrs = JSON.parse(request.requestBody);
    const paletteId = attrs.data[0].id;
    const color = schema.colors.find(request.params.id);
    color.paletteIds.removeObject(paletteId);
    color.update();
  });

  this.post('/colors/:id/relationships/palettes', function(schema, request) {
    const attrs = JSON.parse(request.requestBody);
    const paletteId = attrs.data[0].id;
    const color = schema.colors.find(request.params.id);
    color.paletteIds.pushObject(paletteId);
    color.update();
  });

  this.del('/palettes/:id/relationships/colors', function(schema, request) {
    const attrs = JSON.parse(request.requestBody);
    const colorId = attrs.data[0].id;
    const palette = schema.palettes.find(request.params.id);
    palette.colorIds.pushObject(colorId);
    palette.update();
  });

  this.post('/palettes/:id/relationships/colors', function(schema, request) {
    const attrs = JSON.parse(request.requestBody);
    const colorId = attrs.data[0].id;
    const palette = schema.palettes.find(request.params.id);
    palette.colorIds.removeObject(colorId);
    palette.update();
  });
}

import Route from '@ember/routing/route';

export default class ColorManagerPalettesRoute extends Route {
  async model(){
    const colors = this.store.findAll('color');
    const palettes = this.store.findAll('palette');

    return {
      colors,
      palettes
    }
  }
}

import Route from '@ember/routing/route';

export default class ColorManagerPalettesRoute extends Route {
  async model() {
    const palettes = await this.store.findAll('palette');
    const colorHistory = palettes.findBy('isColorHistory', true);

    return {
      colorHistory,
      palettes: palettes.filterBy('isColorHistory', false)
    };
  }
}

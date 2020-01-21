import Route from '@ember/routing/route';

export default class PalettesRoute extends Route {
  async model() {
    const palettes = await this.store.find('palette');
    const colorHistory = palettes.findBy('isColorHistory', true);

    return {
      colorHistory,
      palettes
    };
  }
}

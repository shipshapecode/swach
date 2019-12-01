import Route from '@ember/routing/route';

export default class IndexColorManagerRoute extends Route {
  async beforeModel() {
    const palettes = await this.store.findAll('palette');
    let colorHistory = palettes.findBy('isColorHistory', true);

    if(!colorHistory){
      colorHistory = this.store.createRecord('palette', {
        isColorHistory: true
      });
      await colorHistory.save();
    }

    this.replaceWith('color-manager.palettes');
  }
}

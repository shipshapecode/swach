import Model, { attr } from '@ember-data/model';

export default class SettingsModel extends Model {
  @attr('string') osTheme;
  @attr('string') userTheme;
}

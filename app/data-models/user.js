import { Model, attr, hasMany } from 'ember-orbit';

export default class User extends Model {
  @attr('string') firstName;
  @attr('string') lastName;
  @attr('string') email;
  @attr('boolean') isActive;

  @hasMany('palette', { inverse: 'user' }) palettes;
}

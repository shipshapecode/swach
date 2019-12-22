import Component from '@glimmer/component';
import { fadeOut } from 'ember-animated/motions/opacity';
import move from 'ember-animated/motions/move';

export default class PalettesListComponent extends Component {
  *transition({ keptSprites, insertedSprites, removedSprites }) {
    for (let sprite of insertedSprites) {
      sprite.startTranslatedBy(0, -sprite.finalBounds.height / 2);
      move(sprite);
    }

    for (let sprite of keptSprites) {
      move(sprite);
    }

    for (let sprite of removedSprites) {
      fadeOut(sprite);
    }
  }
}

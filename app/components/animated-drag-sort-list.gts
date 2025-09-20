import { action, set } from '@ember/object';
import TransitionContext from 'ember-animated/-private/transition-context';
import AnimatedContainer from 'ember-animated/components/animated-container';
import AnimatedEach from 'ember-animated/components/animated-each';
import { easeOut } from 'ember-animated/easings/cosine';
import move from 'ember-animated/motions/move';
import { fadeOut } from 'ember-animated/motions/opacity';
import DragSortItem from 'ember-drag-sort/components/drag-sort-item';
import DragSortList from 'ember-drag-sort/components/drag-sort-list';

export default class AnimatedDragSortList extends DragSortList {
  <template>
    {{!@glint-nocheck}}
    <AnimatedContainer ...attributes>
      {{#AnimatedEach @items duration=400 rules=this.rules as |item index|}}
        <DragSortItem
          @additionalArgs={{@additionalArgs}}
          @item={{item}}
          @index={{index}}
          @items={{@items}}
          @group={{@group}}
          @handle={{@handle}}
          @class={{@childClass}}
          @tagName={{@childTagName}}
          @isHorizontal={{@isHorizontal}}
          @isRtl={{@isRtl}}
          @draggingEnabled={{this.draggingEnabled}}
          @dragEndAction={{@dragEndAction}}
          @determineForeignPositionAction={{@determineForeignPositionAction}}
          @sourceOnly={{@sourceOnly}}
        >
          {{yield item index}}
        </DragSortItem>
      {{/AnimatedEach}}
    </AnimatedContainer>
  </template>
  didDrag = false;

  dragEnter = (event: DragEvent) => {
    set(this, 'didDrag', true);
    super.dragEnter(event);
  };

  @action
  rules() {
    if (!this.didDrag) {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      return this.transition;
    }

    set(this, 'didDrag', false);

    return null;
  }

  // eslint-disable-next-line require-yield
  *transition({
    keptSprites,
    insertedSprites,
    removedSprites,
  }: TransitionContext) {
    for (const sprite of insertedSprites) {
      if (sprite.finalBounds?.height) {
        sprite.startTranslatedBy(0, -sprite.finalBounds.height / 2);
      }

      move(sprite, { easing: easeOut });
    }

    for (const sprite of keptSprites) {
      move(sprite, { easing: easeOut });
    }

    for (const sprite of removedSprites) {
      fadeOut(sprite, { easing: easeOut });
    }
  }
}

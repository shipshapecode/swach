import 'ember-cli-flash';
import { ComponentLike, HelperLike, ModifierLike } from '@glint/template';
import AnimatedContainer from '@gavant/glint-template-types/types/ember-animated/animated-container';
import AnimatedEach from '@gavant/glint-template-types/types/ember-animated/animated-each';
import AnimatedValue from '@gavant/glint-template-types/types/ember-animated/animated-value';

import OnClickOutsideModifier from 'ember-click-outside/modifiers/on-click-outside';

import DidInsertModifier from 'ember-render-modifiers/modifiers/did-insert';
import DidUpdateModifier from 'ember-render-modifiers/modifiers/did-update';
import WillDestroyModifier from 'ember-render-modifiers/modifiers/will-destroy';

import SvgJarHelper from 'ember-svg-jar/helpers/svg-jar';

import AndHelper from 'ember-truth-helpers/helpers/and';
import EqHelper from 'ember-truth-helpers/helpers/eq';
import NotHelper from 'ember-truth-helpers/helpers/not';
import NotEqHelper from 'ember-truth-helpers/helpers/not-eq';
import OrHelper from 'ember-truth-helpers/helpers/or';

// Types for compiled templates
declare module 'swach/templates/*' {
  import { TemplateFactory } from 'ember-cli-htmlbars';
  const tmpl: TemplateFactory;
  export default tmpl;
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    AnimatedContainer: typeof AnimatedContainer;
    'animated-each': typeof AnimatedEach;
    AnimatedValue: typeof AnimatedValue;
    and: typeof AndHelper;
    capitalize: HelperLike<{
      Args: {
        Positional: [input: string];
      };
      Return: string;
    }>;
    'css-transition': ModifierLike<{
      Args: {
        Named: {
          enterActiveClass: string;
          enterClass: string;
          enterToClass: string;
          leaveActiveClass: string;
          leaveClass: string;
          leaveToClass: string;
        };
      };
    }>;
    'did-insert': typeof DidInsertModifier;
    'did-update': typeof DidUpdateModifier;
    eq: typeof EqHelper;
    'liquid-outlet': ComponentLike;
    not: typeof NotHelper;
    'not-eq': typeof NotEqHelper;
    'on-click-outside': typeof OnClickOutsideModifier;
    or: typeof OrHelper;
    'prevent-default': HelperLike<{
      Args: {
        Positional: [eventHandler: (event: Event) => void];
      };
      Return: (event: Event) => void;
    }>;
    'svg-jar': typeof SvgJarHelper;
    'will-destroy': typeof WillDestroyModifier;
  }
}

declare global {
  declare function requireNode(name: string): any;
}

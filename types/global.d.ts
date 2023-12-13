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

import type EmberMathRegistry from 'ember-math-helpers/template-registry';
import type EmberTruthRegistry from 'ember-truth-helpers/template-registry';

// Types for compiled templates
declare module 'swach/templates/*' {
  import { TemplateFactory } from 'ember-cli-htmlbars';
  const tmpl: TemplateFactory;
  export default tmpl;
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry
    extends EmberMathRegistry,
      EmberTruthRegistry {
    AnimatedContainer: typeof AnimatedContainer;
    'animated-each': typeof AnimatedEach;
    AnimatedValue: typeof AnimatedValue;
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
    EmberPopover: ComponentLike<{
      Element: HTMLDivElement;
      Args: {
        Named: {
          arrowClass: string;
          event: string;
          innerClass: string;
          isShown: boolean;
          side: string;
          spacing: number;
          tooltipClass: string;
        };
      };
    }>;
    'html-safe': HelperLike<{
      Args: {
        Positional: [string: string];
      };
      Return: string;
    }>;
    'liquid-outlet': ComponentLike;
    OneWayInputMask: ComponentLike<{
      Element: HTMLInputElement;
      Args: {
        Named: {
          mask: string;
          options: {
            greedy?: boolean;
            isComplete: (buffer: Buffer, opts: { regex: string }) => boolean;
            max?: number;
            min?: number;
            oncomplete: (event: InputEvent) => void;
            onincomplete: (event: InputEvent) => void;
            regex: RegExp;
            showMaskOnFocus: boolean;
            showMaskOnHover: boolean;
            unmaskAsNumber?: boolean;
          };
          update: (value: string | number) => void;
          value?: string;
        };
      };
    }>;
    'on-click-outside': typeof OnClickOutsideModifier;
    or: typeof OrHelper;
    'prevent-default': HelperLike<{
      Args: {
        Positional: [eventHandler: (event: Event) => void];
      };
      Return: (event: Event) => void;
    }>;
    set: HelperLike<{
      Args: {
        Positional: [target: object, path: string, maybeValue: any];
      };
      Return: any;
    }>;
    'set-body-class': HelperLike<{
      Args: {
        Positional: [className: string];
      };
      Return: any;
    }>;
    'stop-propagation': HelperLike<{
      Args: {
        Positional: [eventHandler: (event: Event) => any];
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

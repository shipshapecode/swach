import 'ember-cli-flash';
import '@glint/environment-ember-loose'
import { ComponentLike, HelperLike, ModifierLike } from '@glint/template';

import OnClickOutsideModifier from 'ember-click-outside/modifiers/on-click-outside';

import SvgJarHelper from 'ember-svg-jar/helpers/svg-jar';

// Types for compiled templates
declare module 'swach/templates/*' {
  import { TemplateFactory } from 'ember-cli-htmlbars';
  const tmpl: TemplateFactory;
  export default tmpl;
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
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
    'svg-jar': typeof SvgJarHelper;
  }
}

declare global {
  declare function requireNode(name: string): any;
}

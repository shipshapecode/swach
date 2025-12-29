import 'ember-cli-flash';
import '@glint/environment-ember-loose'
import { ComponentLike, HelperLike, ModifierLike } from '@glint/template';
import type { MagnifierAPI } from '../electron-app/magnifier/types';

import OnClickOutsideModifier from 'ember-click-outside/modifiers/on-click-outside';

import SvgJarHelper from 'ember-svg-jar/helpers/svg-jar';

// Types for compiled templates
declare module 'Swach/templates/*' {
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
  interface Window {
    electronAPI: {
      platform: 'darwin' | 'linux' | 'win32';
      ipcRenderer: {
        send: (channel: string, ...args: any[]) => void;
        on: (channel: string, func: (...args: any[]) => void) => (...args: any[]) => void;
        off: (channel: string, func: (...args: any[]) => void) => void;
        once: (channel: string, func: (...args: any[]) => void) => void;
        invoke: (channel: string, ...args: any[]) => Promise<any>;
        removeAllListeners: (channel: string) => void;
      };
    };
    magnifierAPI: MagnifierAPI;
  }

  namespace NodeJS {
    interface ProcessEnv {
      APPLE_ID: string;
      APPLE_ID_PASSWORD: string;
      WINDOWS_PFX_FILE: string;
      WINDOWS_PFX_PASSWORD: string;
    }
  }
}

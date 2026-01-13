import 'ember-cli-flash';
import '@glint/environment-ember-loose'
import { ModifierLike } from '@glint/template';
import type { MagnifierAPI } from '../electron-app/magnifier/types';

import OnClickOutsideModifier from 'ember-click-outside/modifiers/on-click-outside';

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
    'on-click-outside': typeof OnClickOutsideModifier;
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

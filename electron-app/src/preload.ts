import { init } from '@sentry/electron';
import { contextBridge, ipcRenderer } from 'electron';
import pkg from '../../package.json';

init({
  appName: 'swach',
  dsn: 'https://6974b46329f24dc1b9fca4507c65e942@sentry.io/3956140',
  release: `v${pkg.version}`,
});

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer: {
    send: (channel: string, ...args: unknown[]) =>
      ipcRenderer.send(channel, ...args),
    on: (channel: string, func: (...args: unknown[]) => void) => {
      const subscription = (_event: unknown, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);
      return subscription;
    },
    off: (channel: string, func: (...args: unknown[]) => void) =>
      ipcRenderer.off(channel, func),
    once: (channel: string, func: (...args: unknown[]) => void) => {
      ipcRenderer.once(channel, (_event: unknown, ...args: unknown[]) =>
        func(...args)
      );
    },
    invoke: (channel: string, ...args: unknown[]) =>
      ipcRenderer.invoke(channel, ...args),
    removeAllListeners: (channel: string) =>
      ipcRenderer.removeAllListeners(channel),
  },
});

import { contextBridge, ipcRenderer } from 'electron';

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

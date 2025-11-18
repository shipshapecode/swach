import { contextBridge, ipcRenderer } from 'electron';

// Expose only the specific IPC channels needed for the magnifier picker
contextBridge.exposeInMainWorld('magnifierAPI', {
  // Send methods for magnifier-specific events
  send: {
    ready: () => ipcRenderer.send('magnifier-ready'),
    colorSelected: () => ipcRenderer.send('color-selected'),
    cancelled: () => ipcRenderer.send('picker-cancelled'),
  },

  // Receive methods for magnifier-specific updates
  on: {
    updatePosition: (
      callback: (data: {
        x: number;
        y: number;
        displayX: number;
        displayY: number;
      }) => void
    ) => {
      const subscription = (_event: unknown, data: unknown) =>
        callback(data as any);
      ipcRenderer.on('update-magnifier-position', subscription);
      return subscription;
    },
    updatePixelGrid: (
      callback: (data: {
        centerColor: { hex: string; r: number; g: number; b: number };
        colorName: string;
        pixels: Array<Array<{ hex: string; r: number; g: number; b: number }>>;
      }) => void
    ) => {
      const subscription = (_event: unknown, data: unknown) =>
        callback(data as any);
      ipcRenderer.on('update-pixel-grid', subscription);
      return subscription;
    },
  },
});

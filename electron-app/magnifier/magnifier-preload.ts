import { contextBridge, ipcRenderer } from 'electron';

// Define the actual API implementation - this is the source of truth for types
export const magnifierAPI = {
  // Send methods for magnifier-specific events
  send: {
    ready: () => ipcRenderer.send('magnifier-ready'),
    colorSelected: () => ipcRenderer.send('color-selected'),
    cancelled: () => ipcRenderer.send('picker-cancelled'),
    zoomDiameter: (delta: number) =>
      ipcRenderer.send('magnifier-zoom-diameter', delta),
    zoomDensity: (delta: number) =>
      ipcRenderer.send('magnifier-zoom-density', delta),
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
      const subscription = (
        _event: unknown,
        data: {
          x: number;
          y: number;
          displayX: number;
          displayY: number;
        }
      ) => callback(data);
      ipcRenderer.on('update-magnifier-position', subscription);
      return subscription;
    },
    updatePixelGrid: (
      callback: (data: {
        centerColor: { hex: string; r: number; g: number; b: number };
        colorName: string;
        pixels: Array<Array<{ hex: string; r: number; g: number; b: number }>>;
        diameter: number;
        gridSize: number;
        squareSize: number;
      }) => void
    ) => {
      const subscription = (
        _event: unknown,
        data: {
          centerColor: { hex: string; r: number; g: number; b: number };
          colorName: string;
          pixels: Array<
            Array<{ hex: string; r: number; g: number; b: number }>
          >;
          diameter: number;
          gridSize: number;
          squareSize: number;
        }
      ) => callback(data);
      ipcRenderer.on('update-pixel-grid', subscription);
      return subscription;
    },
  },
} as const;

// Expose the API to the main world
contextBridge.exposeInMainWorld('magnifierAPI', magnifierAPI);

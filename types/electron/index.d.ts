declare module 'electron' {
  export interface IpcRenderer {
    invoke: (channel: string, ...args) => Promise<any>;
    removeAllListeners: (channel: string) => void;
    send: (channel: string, ...args) => void;
  }
}

declare module 'electron' {
  export interface IpcRenderer {
    invoke: (channel: string, ...args) => Promise<any>;
    on: (channel: string, listener: (event: any, ...args) => void) => void;
    removeAllListeners: (channel: string) => void;
    send: (channel: string, ...args) => void;
  }
}

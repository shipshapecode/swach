declare module 'electron' {
  export interface IpcRenderer {
    invoke: (channel: string, ...args) => Promise<any>;
    send: (channel: string, ...args) => void;
  }
}

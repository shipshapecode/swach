import Service from '@ember/service';
import { service } from '@ember/service';

import type { Store } from 'ember-orbit';

import type { IpcRenderer } from 'electron';

import removeFromTo from 'swach/utils/remove-from-to';

export default class UndoManager extends Service {
  @service declare store: Store;

  callback?: () => unknown;
  commands: {
    undo: () => Promise<void>;
    redo: () => Promise<void>;
  }[] = [];
  index = -1;
  declare ipcRenderer: IpcRenderer;
  isExecuting = false;
  limit = 0;
  undoListener?: (e: KeyboardEvent) => unknown;

  constructor() {
    super(...arguments);

    // If we have Electron running, use the application undo/redo, else use document
    if (typeof requireNode !== 'undefined') {
      const { ipcRenderer } = requireNode('electron');

      this.ipcRenderer = ipcRenderer;

      this.ipcRenderer.on('undoRedo', async (_event: unknown, type: string) => {
        const isRedo = type === 'redo';
        const isUndo = type === 'undo';

        await this._doUndoRedo(isRedo, isUndo);
      });
    } else {
      this.undoListener = async (e: KeyboardEvent) => {
        {
          const key = e.which || e.keyCode;
          // testing for CMD or CTRL
          const ctrl =
            e.ctrlKey || e.metaKey ? e.ctrlKey || e.metaKey : key === 17;
          const isUndo = ctrl && key === 90;
          const isRedo = isUndo && e.shiftKey;

          await this._doUndoRedo(isRedo, isUndo);
        }
      };

      document.addEventListener('keydown', this.undoListener, true);
    }
  }

  willDestroy(): void {
    super.willDestroy();

    if (typeof requireNode === 'undefined' && this.undoListener) {
      document.removeEventListener('keydown', this.undoListener, true);
    }

    if (this.ipcRenderer) {
      this.ipcRenderer.removeAllListeners('undoRedo');
    }
  }

  /**
   * Abstracted out the undo/redo execution so we can use it either in Electron or the browser
   * @param isRedo true if operation is 'redo'
   * @param isUndo true if operation is 'undo'
   * @private
   */
  async _doUndoRedo(isRedo: boolean, isUndo: boolean): Promise<void> {
    if (isRedo) {
      if (!this.isExecuting && this.hasRedo()) {
        await this.redo();
      }
    } else if (isUndo) {
      if (!this.isExecuting && this.hasUndo()) {
        await this.undo();
      }
    }
  }

  async execute(
    command: { undo: () => Promise<void>; redo: () => Promise<void> },
    action: 'undo' | 'redo',
  ): Promise<UndoManager | unknown> {
    if (!command || typeof command[action] !== 'function') {
      return this;
    }

    this.isExecuting = true;

    const executed = await command[action]();

    this.isExecuting = false;

    return executed;
  }

  /**
   * Add a command to the queue.
   */
  async add(command: {
    undo: () => Promise<void>;
    redo: () => Promise<void>;
  }): Promise<UndoManager> {
    if (this.isExecuting) {
      return this;
    }

    // if we are here after having called undo,
    // invalidate items higher on the stack
    this.commands.splice(this.index + 1, this.commands.length - this.index);

    this.commands.push(command);

    // if limit is set, remove items from the start
    if (this.limit && this.commands.length > this.limit) {
      removeFromTo(this.commands, 0, -(this.limit + 1));
    }

    // set the current index to the end
    this.index = this.commands.length - 1;

    if (this.callback) {
      await this.callback();
    }

    return this;
  }

  /**
   * Pass a function to be called on undo and redo actions.
   */
  setCallback(callbackFunc: () => unknown): void {
    this.callback = callbackFunc;
  }

  /**
   * Perform undo: call the undo function at the current index and decrease the index by 1.
   */
  async undo(): Promise<UndoManager | unknown> {
    const command = this.commands[this.index];

    if (!command) {
      return this;
    }

    const executed = await this.execute(command, 'undo');

    this.index -= 1;

    if (this.callback) {
      this.callback();
    }

    return executed;
  }

  /**
   * Perform redo: call the redo function at the next index and increase the index by 1.
   */
  async redo(): Promise<UndoManager | unknown> {
    const command = this.commands[this.index + 1];

    if (!command) {
      return this;
    }

    const executed = await this.execute(command, 'redo');

    this.index += 1;

    if (this.callback) {
      this.callback();
    }

    return executed;
  }

  /**
   * Clears the memory, losing all stored states. Reset the index.
   */
  clear(): void {
    const prev_size = this.commands.length;

    this.commands = [];
    this.index = -1;

    if (this.callback && prev_size > 0) {
      this.callback();
    }
  }

  hasUndo(): boolean {
    return this.index !== -1;
  }

  hasRedo(): boolean {
    return this.index < this.commands.length - 1;
  }

  getCommands(): { undo: () => Promise<void>; redo: () => Promise<void> }[] {
    return this.commands;
  }

  getIndex(): number {
    return this.index;
  }

  setLimit(l: number): void {
    this.limit = l;
  }

  setupUndoRedo(): void {
    const transformId = this.store.transformLog.head;
    const redoTransform = this.store.getTransform(transformId).operations;
    const undoTransform = this.store.getInverseOperations(transformId);

    const undo = async () => {
      await this.store.update(undoTransform);
    };

    const redo = async () => {
      await this.store.update(redoTransform);
    };

    this.add({ undo, redo });
  }
}

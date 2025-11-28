import { ChildProcess, spawn } from 'child_process';
import { join } from 'path';

import { app } from 'electron';
import isDev from 'electron-is-dev';

interface PixelData {
  cursor: { x: number; y: number };
  center: { r: number; g: number; b: number; hex: string };
  grid: Array<Array<{ r: number; g: number; b: number; hex: string }>>;
  timestamp: number;
}

interface ErrorResponse {
  error: string;
}

type SamplerResponse = PixelData | ErrorResponse;

type SamplerCallback = (data: PixelData) => void;
type ErrorCallback = (error: string) => void;

export class RustSamplerManager {
  private process: ChildProcess | null = null;
  public dataCallback: SamplerCallback | null = null;
  public errorCallback: ErrorCallback | null = null;

  private getBinaryPath(): string {
    if (isDev) {
      // In development, use the debug build
      const ext = process.platform === 'win32' ? '.exe' : '';
      return join(
        app.getAppPath(),
        'rust-sampler',
        'target',
        'debug',
        `swach-sampler${ext}`
      );
    } else {
      // In production, binary is in resources
      const ext = process.platform === 'win32' ? '.exe' : '';
      const resourcesPath = process.resourcesPath;
      return join(resourcesPath, `swach-sampler${ext}`);
    }
  }

  start(
    gridSize: number,
    sampleRate: number,
    onData: SamplerCallback,
    onError: ErrorCallback
  ): void {
    if (this.process) {
      console.warn('[RustSampler] Process already running, stopping first');
      this.stop();
    }

    this.dataCallback = onData;
    this.errorCallback = onError;

    const binaryPath = this.getBinaryPath();
    console.log('[RustSampler] Spawning process:', binaryPath);

    this.process = spawn(binaryPath, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    if (!this.process.stdout || !this.process.stdin || !this.process.stderr) {
      const error = 'Failed to create process stdio streams';
      console.error('[RustSampler]', error);
      this.errorCallback?.(error);
      return;
    }

    // Set up data handlers
    let buffer = '';
    this.process.stdout.on('data', (data: Buffer) => {
      buffer += data.toString();

      // Process complete JSON lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          try {
            const parsed = JSON.parse(line) as SamplerResponse;

            if ('error' in parsed) {
              console.error('[RustSampler] Error:', parsed.error);
              this.errorCallback?.(parsed.error);
            } else {
              this.dataCallback?.(parsed);
            }
          } catch (e) {
            console.error('[RustSampler] Failed to parse JSON:', line, e);
          }
        }
      }
    });

    this.process.stderr.on('data', (data: Buffer) => {
      console.error('[RustSampler stderr]', data.toString());
    });

    this.process.on('error', (error: Error) => {
      console.error('[RustSampler] Process error:', error);
      this.errorCallback?.(error.message);
    });

    this.process.on('exit', (code: number | null, signal: string | null) => {
      console.log(
        `[RustSampler] Process exited with code ${code}, signal ${signal}`
      );
      this.process = null;
    });

    // Send start command
    const startCommand = {
      command: 'start',
      grid_size: gridSize,
      sample_rate: sampleRate,
    };

    this.sendCommand(startCommand);
  }

  /**
   * Ensure sampler is started and wait for first successful data callback
   * This is useful for triggering permission dialogs before showing UI
   */
  async ensureStarted(gridSize: number, sampleRate: number): Promise<void> {
    return new Promise((resolve, reject) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('Timeout waiting for sampler to start'));
        }
      }, 30000); // 30 second timeout for permission dialog

      // Start with a temporary callback that resolves on first data
      this.start(
        gridSize,
        sampleRate,
        () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve();
          }
        },
        (error) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            reject(new Error(error));
          }
        }
      );
    });
  }

  updateGridSize(gridSize: number): void {
    console.log(`[RustSampler] Sending update_grid command: ${gridSize}`);
    const command = {
      command: 'update_grid',
      grid_size: gridSize,
    };
    this.sendCommand(command);
    console.log(`[RustSampler] Command sent:`, JSON.stringify(command));
  }

  stop(): void {
    if (!this.process) {
      return;
    }

    console.log('[RustSampler] Stopping process');

    const proc = this.process;
    this.process = null;
    this.dataCallback = null;
    this.errorCallback = null;

    // Send stop command
    const stopCommand = { command: 'stop' };
    try {
      if (proc.stdin) {
        const json = JSON.stringify(stopCommand);
        proc.stdin.write(json + '\n');
        // Close stdin to signal EOF
        proc.stdin.end();
      }
    } catch (e) {
      console.error('[RustSampler] Failed to send stop command:', e);
    }

    // Give it a moment to clean up, then force kill if needed
    setTimeout(() => {
      if (proc && !proc.killed) {
        console.log('[RustSampler] Force killing process');
        proc.kill('SIGTERM');
      }
    }, 500);
  }

  private sendCommand(command: object): void {
    if (!this.process) {
      console.error('[RustSampler] Cannot send command, process is null');
      return;
    }

    if (!this.process.stdin) {
      console.error('[RustSampler] Cannot send command, process.stdin is null');
      console.error('[RustSampler] Process state:', {
        killed: this.process.killed,
        exitCode: this.process.exitCode,
        signalCode: this.process.signalCode,
      });
      return;
    }

    try {
      const json = JSON.stringify(command);
      console.log('[RustSampler] Writing to stdin:', json);
      this.process.stdin.write(json + '\n');
      console.log('[RustSampler] Write successful');
    } catch (e) {
      console.error('[RustSampler] Failed to send command:', e);
    }
  }

  isRunning(): boolean {
    return this.process !== null && !this.process.killed;
  }
}

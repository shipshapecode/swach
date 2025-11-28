import { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RustSamplerManager, type PixelData } from './rust-sampler-manager';

// Mock child_process
vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

// Mock electron modules
vi.mock('electron', () => ({
  app: {
    getAppPath: () => '/mock/app/path',
  },
}));

vi.mock('electron-is-dev', () => ({
  default: true,
}));

class MockChildProcess extends EventEmitter {
  stdin: any;
  stdout: any;
  stderr: any;
  killed = false;
  exitCode: number | null = null;
  signalCode: string | null = null;

  constructor() {
    super();
    this.stdin = new EventEmitter();
    this.stdin.write = vi.fn();
    this.stdin.end = vi.fn();
    this.stdin.destroyed = false;

    this.stdout = new EventEmitter();
    this.stderr = new EventEmitter();
  }

  kill(signal?: string) {
    if (!this.killed) {
      this.killed = true;
      this.exitCode = null;
      this.signalCode = signal || 'SIGTERM';
      setTimeout(() => {
        this.emit('exit', null, this.signalCode);
        this.emit('close', null, this.signalCode);
      }, 10);
    }
    return true;
  }
}

describe('RustSamplerManager', () => {
  let manager: RustSamplerManager;
  let mockProcess: MockChildProcess;
  let spawnMock: any;

  beforeEach(async () => {
    manager = new RustSamplerManager();
    mockProcess = new MockChildProcess();

    const childProcessModule = await import('child_process');
    spawnMock = vi.mocked(childProcessModule.spawn);
    spawnMock.mockReturnValue(mockProcess as any);
  });

  afterEach(async () => {
    // Only stop if the process is actually running
    // Some tests manually kill the process
    if (manager.isRunning()) {
      await manager.stop();
    }
    vi.clearAllMocks();
  });

  describe('start', () => {
    it('should spawn the rust sampler process', async () => {
      const onData = vi.fn();
      const onError = vi.fn();

      const startPromise = manager.start(9, 20, onData, onError);

      // Wait a bit for spawn to be called
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(spawnMock).toHaveBeenCalledWith(
        expect.stringContaining('swach-sampler'),
        [],
        { stdio: ['pipe', 'pipe', 'pipe'] }
      );

      await manager.stop();
    });

    it('should send start command after spawning', async () => {
      const onData = vi.fn();
      const onError = vi.fn();

      await manager.start(9, 20, onData, onError);

      // Wait for command to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"command":"start"')
      );
      expect(mockProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"grid_size":9')
      );
      expect(mockProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"sample_rate":20')
      );

      await manager.stop();
    });

    it('should call onData callback when valid pixel data is received', async () => {
      const onData = vi.fn();
      const onError = vi.fn();

      await manager.start(9, 20, onData, onError);

      const pixelData: PixelData = {
        cursor: { x: 100, y: 200 },
        center: { r: 255, g: 128, b: 64, hex: '#FF8040' },
        grid: [[{ r: 0, g: 0, b: 0, hex: '#000000' }]],
        timestamp: 1234567890,
      };

      mockProcess.stdout.emit(
        'data',
        Buffer.from(JSON.stringify(pixelData) + '\n')
      );

      // Wait for data to be processed
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onData).toHaveBeenCalledWith(pixelData);
      expect(onError).not.toHaveBeenCalled();

      await manager.stop();
    });

    it('should call onError callback when error response is received', async () => {
      const onData = vi.fn();
      const onError = vi.fn();

      await manager.start(9, 20, onData, onError);

      const errorResponse = { error: 'Test error message' };

      mockProcess.stdout.emit(
        'data',
        Buffer.from(JSON.stringify(errorResponse) + '\n')
      );

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onError).toHaveBeenCalledWith('Test error message');
      expect(onData).not.toHaveBeenCalled();

      await manager.stop();
    });

    it('should handle incomplete JSON lines', async () => {
      const onData = vi.fn();
      const onError = vi.fn();

      await manager.start(9, 20, onData, onError);

      const pixelData: PixelData = {
        cursor: { x: 100, y: 200 },
        center: { r: 255, g: 128, b: 64, hex: '#FF8040' },
        grid: [[{ r: 0, g: 0, b: 0, hex: '#000000' }]],
        timestamp: 1234567890,
      };

      const json = JSON.stringify(pixelData);

      // Send partial data
      mockProcess.stdout.emit('data', Buffer.from(json.slice(0, 50)));
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should not have called onData yet
      expect(onData).not.toHaveBeenCalled();

      // Send rest of data with newline
      mockProcess.stdout.emit('data', Buffer.from(json.slice(50) + '\n'));
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Now should have called onData
      expect(onData).toHaveBeenCalledWith(pixelData);

      await manager.stop();
    });

    it('should handle malformed JSON gracefully', async () => {
      const onData = vi.fn();
      const onError = vi.fn();

      await manager.start(9, 20, onData, onError);

      mockProcess.stdout.emit('data', Buffer.from('{"invalid json\n'));

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should not crash, just not call callbacks
      expect(onData).not.toHaveBeenCalled();

      await manager.stop();
    });

    it('should handle process error events', async () => {
      const onData = vi.fn();
      const onError = vi.fn();

      await manager.start(9, 20, onData, onError);

      const error = new Error('Process error');
      mockProcess.emit('error', error);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onError).toHaveBeenCalledWith('Process error');

      await manager.stop();
    });

    it('should stop existing process before starting new one', async () => {
      const onData1 = vi.fn();
      const onError1 = vi.fn();
      const onData2 = vi.fn();
      const onError2 = vi.fn();

      await manager.start(9, 20, onData1, onError1);

      const firstProcess = mockProcess;
      const killSpy = vi.spyOn(firstProcess, 'kill');

      // Create new mock process for second start
      const newMockProcess = new MockChildProcess();
      spawnMock.mockReturnValue(newMockProcess);

      await manager.start(11, 30, onData2, onError2);

      expect(killSpy).toHaveBeenCalled();
    });

    it('should handle missing stdio streams', async () => {
      const onData = vi.fn();
      const onError = vi.fn();

      // Create process with null stdout
      const brokenProcess = new MockChildProcess();
      brokenProcess.stdout = null as any;
      spawnMock.mockReturnValue(brokenProcess);

      await manager.start(9, 20, onData, onError);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create process stdio streams')
      );
    });
  });

  describe('ensureStarted', () => {
    it('should resolve when first data is received', async () => {
      const promise = manager.ensureStarted(9, 20);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const pixelData: PixelData = {
        cursor: { x: 100, y: 200 },
        center: { r: 255, g: 128, b: 64, hex: '#FF8040' },
        grid: [[{ r: 0, g: 0, b: 0, hex: '#000000' }]],
        timestamp: 1234567890,
      };

      mockProcess.stdout.emit(
        'data',
        Buffer.from(JSON.stringify(pixelData) + '\n')
      );

      await expect(promise).resolves.toBeUndefined();

      await manager.stop();
    });

    it('should reject on error', async () => {
      const promise = manager.ensureStarted(9, 20);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const errorResponse = { error: 'Test error' };
      mockProcess.stdout.emit(
        'data',
        Buffer.from(JSON.stringify(errorResponse) + '\n')
      );

      await expect(promise).rejects.toThrow('Test error');

      await manager.stop();
    });

    it('should timeout after 30 seconds', async () => {
      vi.useFakeTimers();

      const promise = manager.ensureStarted(9, 20);

      // Advance timers immediately - don't wait
      vi.advanceTimersByTime(30001);

      await expect(promise).rejects.toThrow(
        'Timeout waiting for sampler to start'
      );

      vi.useRealTimers();
    });
  });

  describe('updateGridSize', () => {
    it('should send update_grid command', async () => {
      const onData = vi.fn();
      const onError = vi.fn();

      await manager.start(9, 20, onData, onError);

      mockProcess.stdin.write.mockClear();

      manager.updateGridSize(11);

      expect(mockProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"command":"update_grid"')
      );
      expect(mockProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"grid_size":11')
      );

      await manager.stop();
    });

    it('should not crash if called without active process', () => {
      expect(() => manager.updateGridSize(11)).not.toThrow();
    });
  });

  describe('stop', () => {
    it('should send stop command and close stdin', async () => {
      const onData = vi.fn();
      const onError = vi.fn();

      await manager.start(9, 20, onData, onError);

      mockProcess.stdin.write.mockClear();

      const stopPromise = manager.stop();

      expect(mockProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"command":"stop"')
      );
      expect(mockProcess.stdin.end).toHaveBeenCalled();

      await stopPromise;
    });

    it('should force kill if process does not exit gracefully', async () => {
      vi.useFakeTimers();

      const onData = vi.fn();
      const onError = vi.fn();

      await manager.start(9, 20, onData, onError);

      // Don't emit exit event to simulate hanging process
      mockProcess.kill = vi.fn().mockReturnValue(true);

      const stopPromise = manager.stop();

      // Advance time past the force kill timeout (500ms + buffer)
      vi.advanceTimersByTime(700);

      expect(mockProcess.kill).toHaveBeenCalled();

      vi.useRealTimers();
      await stopPromise;
    });

    it('should resolve immediately if no process is running', async () => {
      await expect(manager.stop()).resolves.toBeUndefined();
    });

    it('should clear callbacks after stopping', async () => {
      const onData = vi.fn();
      const onError = vi.fn();

      await manager.start(9, 20, onData, onError);
      await manager.stop();

      expect(manager.dataCallback).toBeNull();
      expect(manager.errorCallback).toBeNull();
    });
  });

  describe('isRunning', () => {
    it('should return false initially', () => {
      expect(manager.isRunning()).toBe(false);
    });

    it('should return true after starting', async () => {
      const onData = vi.fn();
      const onError = vi.fn();

      await manager.start(9, 20, onData, onError);

      expect(manager.isRunning()).toBe(true);

      await manager.stop();
    });

    it('should return false after stopping', async () => {
      const onData = vi.fn();
      const onError = vi.fn();

      await manager.start(9, 20, onData, onError);
      await manager.stop();

      expect(manager.isRunning()).toBe(false);
    });

    it('should return false if process is killed', async () => {
      const onData = vi.fn();
      const onError = vi.fn();

      await manager.start(9, 20, onData, onError);

      // Simulate external kill
      mockProcess.killed = true;

      expect(manager.isRunning()).toBe(false);

      // Let afterEach clean up
    });
  });

  describe('stderr handling', () => {
    it('should log stderr data', async () => {
      const onData = vi.fn();
      const onError = vi.fn();
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await manager.start(9, 20, onData, onError);

      mockProcess.stderr.emit('data', Buffer.from('Debug message\n'));

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('RustSampler stderr'),
        expect.any(String)
      );

      consoleErrorSpy.mockRestore();
      await manager.stop();
    });
  });

  describe('process exit handling', () => {
    it('should clean up on process exit', async () => {
      const onData = vi.fn();
      const onError = vi.fn();

      await manager.start(9, 20, onData, onError);

      mockProcess.emit('exit', 0, null);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(manager.isRunning()).toBe(false);
    });
  });

  describe('multiple pixel data messages', () => {
    it('should handle rapid data updates', async () => {
      const onData = vi.fn();
      const onError = vi.fn();

      await manager.start(9, 20, onData, onError);

      // Send 50 pixel data messages
      for (let i = 0; i < 50; i++) {
        const pixelData: PixelData = {
          cursor: { x: i, y: i },
          center: { r: i % 256, g: i % 256, b: i % 256, hex: '#000000' },
          grid: [[{ r: 0, g: 0, b: 0, hex: '#000000' }]],
          timestamp: Date.now() + i,
        };

        mockProcess.stdout.emit(
          'data',
          Buffer.from(JSON.stringify(pixelData) + '\n')
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(onData).toHaveBeenCalledTimes(50);

      await manager.stop();
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdpServer } from '../src/server';
import { WebSocket } from 'ws';

describe('AdpServer EventEmitter', () => {
  let server: AdpServer;
  const PORT = 9223;

  beforeEach(async () => {
    server = new AdpServer(PORT);
  });

  afterEach(async () => {
    await server.close();
  });

  it('should handle commands via .on() and respond via callback', async () => {
    const handler = vi.fn((params, cb) => {
      expect(params.foo).toBe('bar');
      cb({ status: 'ok' });
    });

    server.on('Test.command', handler);

    // Simulate a client connection and message
    const ws = new WebSocket(`ws://localhost:${PORT}`);
    
    await new Promise((resolve) => {
      ws.on('open', () => {
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'Test.command',
          params: { foo: 'bar' }
        }));
      });

      ws.on('message', (data) => {
        const res = JSON.parse(data.toString());
        expect(res.id).toBe(1);
        expect(res.result.status).toBe('ok');
        ws.close();
        resolve(null);
      });
    });

    expect(handler).toHaveBeenCalled();
  });

  it('should broadcast events via .notify()', async () => {
    const ws = new WebSocket(`ws://localhost:${PORT}`);
    
    await new Promise((resolve) => {
      ws.on('open', () => {
        // Once connected, trigger a notification from the server
        server.notify('Test.event', { hello: 'world' });
      });

      ws.on('message', (data) => {
        const event = JSON.parse(data.toString());
        expect(event.method).toBe('Test.event');
        expect(event.params.hello).toBe('world');
        ws.close();
        resolve(null);
      });
    });
  });
});

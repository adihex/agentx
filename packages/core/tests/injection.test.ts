import { describe, it, expect, vi } from 'vitest';
import { AgentEventLoop } from '../src/AgentEventLoop';

describe('AgentEventLoop Tool Injection', () => {
  it('should execute an injected tool', async () => {
    const mockTool = vi.fn().mockResolvedValue({ success: true, data: 'mocked' });
    
    // We want to be able to do this:
    const loop = new AgentEventLoop({
      tools: {
        myCustomTool: mockTool.toString() // Serialize to string for worker
      }
    });

    // Manually trigger the tool (simulating an LLM action or intercept)
    loop.dispatchTool('myCustomTool', { some: 'args' });

    // Wait for the tool result to be processed into the macrotask queue
    // In a real scenario, the loop tick would ingest this.
    // We'll wait a bit for the worker to respond.
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify the tool was called (this will fail because core doesn't support injection yet)
    // Actually, we can't easily verify the mockTool was called if it's in a worker.
    // Instead, we'll check the macrotask queue.
    const macrotasks = (loop as any).macrotaskQueue;
    expect(macrotasks.some((t: any) => t.source === 'myCustomTool')).toBe(true);
    
    await loop.shutdown();
  });

  it('should support custom ADP handlers', async () => {
    const loop = new AgentEventLoop();
    const handler = vi.fn();
    
    loop.registerAdpHandler('Custom.test', handler);
    
    // Simulate an ADP call using the new EventEmitter API
    loop.adp.emit('Custom.test', { foo: 'bar' }, () => {});
    
    expect(handler).toHaveBeenCalledWith({ foo: 'bar' }, expect.any(Function));
    
    await loop.shutdown();
  });
});

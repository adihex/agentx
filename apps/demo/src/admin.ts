import { AdpClient, AdpDomains } from '@agentx/adp';

/**
 * agentx Metacognitive Admin CLI
 *
 * Connects to the running agent's ADP control-plane WebSocket and demonstrates
 * out-of-band commands. Run this while the agent (pnpm start) is running.
 *
 * Usage:
 *   pnpm admin              — sends Inference.halt (default)
 *   pnpm admin pause        — sends Metacognition.pause
 *   pnpm admin resume       — sends Metacognition.resume
 *   pnpm admin compact      — sends Memory.compact
 *   pnpm admin inspect      — sends Metacognition.getCallFrame
 *   pnpm admin inject "msg" — sends Inference.evaluate with a thought
 *   pnpm admin prompt "msg" — sends Session.prompt (triggers inference)
 *   pnpm admin shutdown     — sends Session.shutdown
 */

const COMMANDS: Record<string, string> = {
  halt: AdpDomains.Inference.halt,
  pause: AdpDomains.Metacognition.pause,
  resume: AdpDomains.Metacognition.resume,
  compact: AdpDomains.Memory.compact,
  inspect: AdpDomains.Metacognition.getCallFrame,
  inject: AdpDomains.Inference.evaluate,
  prompt: AdpDomains.Session.prompt,
  shutdown: AdpDomains.Session.shutdown,
};

async function main() {
  const [action = 'halt', ...rest] = process.argv.slice(2);
  const method = COMMANDS[action];

  if (!method) {
    console.error(`Unknown command: "${action}"`);
    console.error(`Available: ${Object.keys(COMMANDS).join(', ')}`);
    process.exit(1);
  }

  const params: Record<string, any> = {};
  if (action === 'inject') {
    params.expression = rest.join(' ') || 'You are stuck. Re-evaluate your approach.';
  }
  if (action === 'prompt') {
    params.prompt = rest.join(' ') || 'Hello, agent!';
  }

  console.log(`🔌  Connecting to ADP on ws://localhost:9222…`);
  const client = new AdpClient('ws://localhost:9222');

  try {
    await client.connect();
    console.log(`✅  Connected`);
    console.log(`📡  Sending ${method}…`);

    const result = await client.send(method, params);
    console.log(`✅  Response:`, JSON.stringify(result, null, 2));
  } catch (err: any) {
    console.error(`❌  Error: ${err.message ?? err}`);
  } finally {
    client.close();
    process.exit(0);
  }
}

main();

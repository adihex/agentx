/**
 * Test fixture tool module — imported by AgenticThreadPool workers in tests.
 * Exercises the dynamic-import execution path (no eval).
 */

/** Echo back the provided input arg. */
export async function echo(args: { input?: unknown }): Promise<{ echoed: unknown }> {
  return { echoed: args.input };
}

/** Always throws — exercises the worker error path. */
export async function fail(): Promise<never> {
  throw new Error("Tool error");
}

/** Never resolves — exercises timeout and worker-exit paths. */
export async function hang(): Promise<never> {
  return new Promise<never>(() => {
    // Intentionally left pending.
  });
}

/** Return the full args object — used to verify schema-normalized arguments. */
export async function echoArgs(args: Record<string, unknown>): Promise<unknown> {
  return args;
}

/** Return a payload of a configurable size — exercises result-size limits. */
export async function bigString(args: { length?: number }): Promise<string> {
  return "x".repeat(args.length ?? 1024);
}

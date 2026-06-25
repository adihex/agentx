/**
 * Stryker Mutation Testing Configuration for agentx
 *
 * Targets core library packages: adp, core, orchestrator, agx-core
 *
 * === ESM Monorepo Limitation (confirmed) ===
 * Attempted Stryker @stryker-mutator/core v9.6.1 with vitest-runner.
 * Fails with: ERR_PACKAGE_PATH_NOT_EXPORTED during TSConfigPreprocessor
 * (TS config rewrite step). Root cause: pnpm workspace ESM export maps
 * are not resolved correctly by Stryker's instrumentation pipeline.
 *
 * This config is preserved for future use when Stryker matures its ESM
 * monorepo support. Manual mutation testing can be performed by:
 *  1. Temporarily mutating source (e.g., flip conditionals, remove calls)
 *  2. Running vitest to verify tests catch the mutation
 *  3. Reverting mutations
 *
 * Alternatives pending evaluation:
 *  - cargo-mutants (ESM-native, Rust-based)
 *  - stryker-js v10 (promised ESM improvements)
 */
export default {
  packageManager: "pnpm",
  reporters: ["clear-text", "progress"],
  testRunner: "vitest",
  testRunnerNodeArgs: ["--experimental-vm-modules"],
  coverageAnalysis: "perTest",
  mutate: [
    "packages/core/src/**/*.ts",
    "packages/adp/src/**/*.ts",
    "packages/orchestrator/src/**/*.ts",
    "packages/agx-core/src/**/*.ts",
    "!packages/**/tests/**",
  ],
  thresholds: {
    high: 80,
    low: 60,
    break: 40,
  },
  timeoutMS: 30000,
  timeoutFactor: 2,
  concurrency: 2,
  ignoreStatic: true,
};

## 2026-09-02 - Sentinel: Mitigate Command Injection Vulnerability in transcribe.ts

**Vulnerability:** In `apps/zettel/src/tools/transcribe.ts`, the `binaryAvailable` function used `sh -c command -v ${bin}` which was susceptible to command injection if the `bin` argument (derived from `process.env.WHISPER_BIN`) contained shell metacharacters.
**Learning:** Even when reading from environment variables, interpolating strings into shell execution wrappers (`sh -c`) can expose systems to command injection vulnerabilities. `execFileSync` without `shell: true` should be preferred.
**Prevention:** Avoid using shell interpolation to evaluate environment variables or command-line arguments. Instead, use an argument array to pass executable names securely. For checking binary existence on `$PATH`, `execFileSync("which", [bin])` safely prevents shell execution by relying directly on the `which` executable and standard IO bindings.

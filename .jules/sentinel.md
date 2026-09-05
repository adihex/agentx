## 2026-09-02 - Sentinel: Mitigate Command Injection Vulnerability in transcribe.ts

**Vulnerability:** In `apps/zettel/src/tools/transcribe.ts`, the `binaryAvailable` function used `sh -c command -v ${bin}` which was susceptible to command injection if the `bin` argument (derived from `process.env.WHISPER_BIN`) contained shell metacharacters.
**Learning:** Even when reading from environment variables, interpolating strings into shell execution wrappers (`sh -c`) can expose systems to command injection vulnerabilities. `execFileSync` without `shell: true` should be preferred.
**Prevention:** Avoid using shell interpolation to evaluate environment variables or command-line arguments. Instead, use an argument array to pass executable names securely. For checking binary existence on `$PATH`, `execFileSync("which", [bin])` safely prevents shell execution by relying directly on the `which` executable and standard IO bindings.

## 2026-09-04 - [Path Traversal bypass via path.basename in POSIX env]
**Vulnerability:** Path traversal in file upload endpoints handling `file.name` via `path.basename`.
**Learning:** In Node.js running on POSIX systems (Linux/macOS), `path.basename` only strips `/`, but an attacker can provide a Windows-style path traversal payload (e.g. `..\..\etc\passwd`). Node's `path.basename` considers the entire string as the file name, meaning `path.join` will parse it and traverse directories.
**Prevention:** Thoroughly sanitize file names using strict regex matching (e.g., `file.name.replace(/[^a-zA-Z0-9.-]/g, "_")`) instead of relying on `path.basename` across mixed OS environments.

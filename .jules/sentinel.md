## 2026-09-04 - [Path Traversal bypass via path.basename in POSIX env]
**Vulnerability:** Path traversal in file upload endpoints handling `file.name` via `path.basename`.
**Learning:** In Node.js running on POSIX systems (Linux/macOS), `path.basename` only strips `/`, but an attacker can provide a Windows-style path traversal payload (e.g. `..\..\etc\passwd`). Node's `path.basename` considers the entire string as the file name, meaning `path.join` will parse it and traverse directories.
**Prevention:** Thoroughly sanitize file names using strict regex matching (e.g., `file.name.replace(/[^a-zA-Z0-9.-]/g, "_")`) instead of relying on `path.basename` across mixed OS environments.

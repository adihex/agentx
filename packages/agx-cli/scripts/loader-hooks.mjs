export async function resolve(specifier, context, defaultResolve) {
  if (specifier.endsWith(".scm")) {
    const { parentURL } = context;
    const url = new URL(specifier, parentURL).href;
    return {
      url,
      format: "module",
      shortCircuit: true,
    };
  }
  return defaultResolve(specifier, context, defaultResolve);
}

export async function load(url, context, defaultLoad) {
  // Assets imported with `with { type: "file" }` (e.g. @opentui/core tree-sitter
  // .wasm / .scm files) are a bundler convention: the import resolves to the
  // asset's path as a string. Node's ESM loader rejects the "file" attribute, so
  // intercept it here and return the resolved filesystem path as the default
  // export — short-circuiting before defaultLoad runs Node's attribute validation.
  if (context.importAttributes?.type === "file") {
    const { fileURLToPath } = await import("node:url");
    const filePath = url.startsWith("file:") ? fileURLToPath(url) : url;
    return {
      format: "module",
      source: `export default ${JSON.stringify(filePath)};`,
      shortCircuit: true,
    };
  }
  if (url.endsWith(".scm")) {
    return {
      format: "module",
      source: 'export default "";',
      shortCircuit: true,
    };
  }
  return defaultLoad(url, context, defaultLoad);
}

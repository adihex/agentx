import { URL } from "url";

/**
 * A custom loader to handle .scm files (Tree-sitter highlights)
 * and potentially other non-JS assets that @opentui/core might import.
 */

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
  if (url.endsWith(".scm")) {
    return {
      format: "module",
      source: 'export default "";', // Just return empty string for highlights
      shortCircuit: true,
    };
  }
  return defaultLoad(url, context, defaultLoad);
}

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
      source: 'export default "";',
      shortCircuit: true,
    };
  }
  return defaultLoad(url, context, defaultLoad);
}

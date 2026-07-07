const API_BASE = import.meta.env.PROD
  ? "https://zettel-service-594828290101.asia-south1.run.app"
  : window.location.origin;

/** Wrapper around fetch that always includes credentials for cross-origin cookies. */
async function authedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...options.headers,
    },
  });
}

export const api = {
  notes: {
    $get: () => authedFetch("/api/notes"),
  },
  note: {
    $get: (opts: { query: { id: string } }) =>
      authedFetch(`/api/note?id=${encodeURIComponent(opts.query.id)}`),
    $put: (opts: {
      json: { id: string; title?: string; content?: string; tags?: string[]; links?: string[] };
    }) =>
      authedFetch("/api/note", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(opts.json),
      }),
    $delete: (opts: { query: { id: string } }) =>
      authedFetch(`/api/note?id=${encodeURIComponent(opts.query.id)}`, {
        method: "DELETE",
      }),
  },
  graph: {
    $get: () => authedFetch("/api/graph"),
  },
  transcribe: {
    $post: (opts: { form: Record<string, unknown> }) => {
      const formData = new FormData();
      for (const [key, value] of Object.entries(opts.form)) {
        formData.append(key, value as Blob);
      }
      return authedFetch("/api/transcribe", { method: "POST", body: formData });
    },
  },
  tools: {
    $get: () => authedFetch("/api/tools"),
    $post: (opts: { json: Record<string, unknown> }) =>
      authedFetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(opts.json),
      }),
    $delete: (opts: { query: { id: string } }) =>
      authedFetch(`/api/tools?id=${encodeURIComponent(opts.query.id)}`, {
        method: "DELETE",
      }),
  },
};

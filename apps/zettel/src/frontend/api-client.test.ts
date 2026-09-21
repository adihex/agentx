import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

vi.stubGlobal("window", { location: { origin: "https://zettel.test" } });
vi.stubGlobal("fetch", fetchMock);

describe("api client", () => {
  let api: typeof import("./api-client.js").api;

  beforeAll(async () => {
    ({ api } = await import("./api-client.js"));
  });

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
  });

  function lastCall() {
    const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
    return { url, init };
  }

  it("fetches the notes index with credentials", async () => {
    await api.notes.$get();
    const { url, init } = lastCall();
    expect(url).toBe("https://zettel.test/api/notes");
    expect(init.credentials).toBe("include");
  });

  it("fetches a single note with an encoded id", async () => {
    await api.note.$get({ query: { id: "a b/c" } });
    expect(lastCall().url).toBe("https://zettel.test/api/note?id=a%20b%2Fc");
  });

  it("PUTs note updates as JSON", async () => {
    await api.note.$put({ json: { id: "n1", title: "T", links: ["x"] } });
    const { url, init } = lastCall();
    expect(url).toBe("https://zettel.test/api/note");
    expect(init.method).toBe("PUT");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(init.body as string)).toEqual({ id: "n1", title: "T", links: ["x"] });
  });

  it("DELETEs a note by id", async () => {
    await api.note.$delete({ query: { id: "n1" } });
    const { url, init } = lastCall();
    expect(url).toBe("https://zettel.test/api/note?id=n1");
    expect(init.method).toBe("DELETE");
  });

  it("fetches the graph and wiki endpoints", async () => {
    await api.graph.$get();
    expect(lastCall().url).toBe("https://zettel.test/api/graph");

    await api.wiki.$get({ param: { entity: "Node JS" } });
    expect(lastCall().url).toBe("https://zettel.test/api/wiki/Node%20JS");
  });

  it("posts transcription uploads as multipart form data", async () => {
    const blob = new Blob(["audio"], { type: "audio/wav" });
    await api.transcribe.$post({ form: { file: blob } });
    const { url, init } = lastCall();
    expect(url).toBe("https://zettel.test/api/transcribe");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("file")).toBeInstanceOf(Blob);
  });

  it("covers the tools CRUD surface", async () => {
    await api.tools.$get();
    expect(lastCall().url).toBe("https://zettel.test/api/tools");

    await api.tools.$post({ json: { name: "t" } });
    let call = lastCall();
    expect(call.init.method).toBe("POST");
    expect(JSON.parse(call.init.body as string)).toEqual({ name: "t" });

    await api.tools.$delete({ query: { id: "tool/1" } });
    call = lastCall();
    expect(call.url).toBe("https://zettel.test/api/tools?id=tool%2F1");
    expect(call.init.method).toBe("DELETE");
  });
});

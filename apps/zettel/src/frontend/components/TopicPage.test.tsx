// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getTopic } = vi.hoisted(() => ({ getTopic: vi.fn() }));

vi.mock("../api-client", () => ({
  api: { wiki: { $get: getTopic } },
}));

import TopicPage from "./TopicPage";

function renderTopic(path = "/wiki/Ada") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/wiki/:entity" element={<TopicPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("TopicPage", () => {
  beforeEach(() => {
    getTopic.mockReset();
  });

  it("loads the authenticated topic API and renders wikilinks as routes", async () => {
    getTopic.mockResolvedValue({
      ok: true,
      json: async () => ({ markdown: "# Ada\n\nRelated to [[Analytical Engine]]." }),
    });

    renderTopic();

    expect(await screen.findByRole("heading", { name: "Ada" })).toBeInTheDocument();
    expect(getTopic).toHaveBeenCalledWith({ param: { entity: "Ada" } });
    expect(screen.getByRole("link", { name: "Analytical Engine" })).toHaveAttribute(
      "href",
      "/wiki/Analytical%20Engine",
    );
  });

  it("shows an API failure", async () => {
    getTopic.mockResolvedValue({ ok: false, json: async () => ({ error: "not available" }) });

    renderTopic();

    expect(await screen.findByRole("alert")).toHaveTextContent("not available");
  });
});

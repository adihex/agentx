// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import SemanticVisualizer from "./SemanticVisualizer";

// Mock reactflow to test component rendering and callbacks under jsdom
vi.mock("reactflow", async () => {
  const actual = await vi.importActual<any>("reactflow");
  return {
    ...actual,
    __esModule: true,
    default: ({ children, onNodeClick, nodes }: any) => (
      <div data-testid="mock-reactflow">
        {nodes.map((node: any) => (
          <button
            key={node.id}
            data-testid={`node-${node.id}`}
            onClick={(e) => onNodeClick && onNodeClick(e, node)}
          >
            {node.data.label}
          </button>
        ))}
        {children}
      </div>
    ),
    Background: () => <div data-testid="mock-background" />,
    ReactFlowProvider: ({ children }: any) => <div data-testid="mock-provider">{children}</div>,
    useReactFlow: () => ({
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      fitView: vi.fn(),
    }),
  };
});

interface Note {
  id: string;
  title: string;
  tags?: string[];
  links?: string[];
  body: string;
  createdAt: number;
}

const mockNotes: Note[] = [
  {
    id: "note-1",
    title: "Central Thought",
    links: ["note-2"],
    body: "First atomic note",
    createdAt: 1000,
  },
  {
    id: "note-2",
    title: "Connected Point",
    links: [],
    body: "Second atomic note",
    createdAt: 2000,
  },
  {
    id: "note-3",
    title: "Backlinking Thought",
    links: ["note-1"],
    body: "Third atomic note",
    createdAt: 3000,
  },
];

describe("SemanticVisualizer Component", () => {
  it("renders empty state placeholder when no selected note is active", () => {
    render(
      <SemanticVisualizer
        selectedNote={null}
        notes={mockNotes}
        backlinks={[]}
      />
    );
    expect(screen.getByText("Awaiting Mapping...")).toBeInTheDocument();
  });

  it("renders center node, links, and backlinks correctly", () => {
    render(
      <SemanticVisualizer
        selectedNote={mockNotes[0]}
        notes={mockNotes}
        backlinks={["note-3"]}
      />
    );

    // Should render the central node
    expect(screen.getByTestId("node-note-1")).toHaveTextContent("Central Thought");
    // Should render the link target node
    expect(screen.getByTestId("node-note-2")).toHaveTextContent("Connected Point");
    // Should render the backlink source node
    expect(screen.getByTestId("node-note-3")).toHaveTextContent("Backlinking Thought");
  });

  it("triggers onNodeClick with correct noteId when a node is clicked", () => {
    const handleNodeClick = vi.fn();
    render(
      <SemanticVisualizer
        selectedNote={mockNotes[0]}
        notes={mockNotes}
        backlinks={["note-3"]}
        onNodeClick={handleNodeClick}
      />
    );

    const nodeButton = screen.getByTestId("node-note-2");
    fireEvent.click(nodeButton);

    expect(handleNodeClick).toHaveBeenCalledTimes(1);
    expect(handleNodeClick).toHaveBeenCalledWith("note-2");
  });
});

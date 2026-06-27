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
        interactive={true}
      />
    );

    // Should render the central node
    expect(screen.getByTestId("node-note-1")).toHaveTextContent("Central Thought");
    // Should render the link target node
    expect(screen.getByTestId("node-note-2")).toHaveTextContent("Connected Point");
    // Should render the backlink source node
    expect(screen.getByTestId("node-note-3")).toHaveTextContent("Backlinking Thought");
  });

  it("triggers onNodeClick with correct noteId when interactive={true} and a node is clicked", () => {
    const handleNodeClick = vi.fn();
    render(
      <SemanticVisualizer
        selectedNote={mockNotes[0]}
        notes={mockNotes}
        backlinks={["note-3"]}
        interactive={true}
        onNodeClick={handleNodeClick}
      />
    );

    const nodeButton = screen.getByTestId("node-note-2");
    fireEvent.click(nodeButton);

    expect(handleNodeClick).toHaveBeenCalledTimes(1);
    expect(handleNodeClick).toHaveBeenCalledWith("note-2");
  });

  it("renders as preview by default (interactive=false) and does not show controls, but triggers onPreviewClick", () => {
    const handlePreviewClick = vi.fn();
    render(
      <SemanticVisualizer
        selectedNote={mockNotes[0]}
        notes={mockNotes}
        backlinks={["note-3"]}
        onPreviewClick={handlePreviewClick}
      />
    );

    // Controls button (hamburger 'menu' icon) should NOT be rendered in preview mode
    expect(screen.queryByTitle("Map Controls")).not.toBeInTheDocument();

    // Clicking the container triggers onPreviewClick
    const container = screen.getByTestId("visualizer-container");
    fireEvent.click(container);
    expect(handlePreviewClick).toHaveBeenCalledTimes(1);
  });

  it("toggles modal state and renders controls inside custom parent container", () => {
    const ParentComponent = () => {
      const [open, setOpen] = React.useState(false);
      return (
        <div>
          <SemanticVisualizer
            selectedNote={mockNotes[0]}
            notes={mockNotes}
            backlinks={[]}
            interactive={false}
            onPreviewClick={() => setOpen(true)}
          />
          {open && (
            <div data-testid="enlarged-modal">
              <SemanticVisualizer
                selectedNote={mockNotes[0]}
                notes={mockNotes}
                backlinks={[]}
                interactive={true}
              />
            </div>
          )}
        </div>
      );
    };

    render(<ParentComponent />);

    // In preview mode: controls button should not be present
    expect(screen.queryByTitle("Map Controls")).not.toBeInTheDocument();
    expect(screen.queryByTestId("enlarged-modal")).not.toBeInTheDocument();

    // Click preview container
    fireEvent.click(screen.getByTestId("visualizer-container"));

    // Modal is opened
    expect(screen.getByTestId("enlarged-modal")).toBeInTheDocument();
    // In interactive mode: controls button should be present
    expect(screen.getByTitle("Map Controls")).toBeInTheDocument();
  });
});

import React, { useMemo, memo, useState } from "react";
import ReactFlow, { Background, Handle, Position, ReactFlowProvider, useReactFlow, type Node, type Edge } from "reactflow";
import "reactflow/dist/style.css";

interface Note {
  id: string;
  title: string;
  tags?: string[];
  links?: string[];
  body: string;
  createdAt: number;
}

interface SemanticVisualizerProps {
  selectedNote: Note | null;
  notes: Note[];
  backlinks: string[];
  onNodeClick?: (noteId: string) => void;
}

// Custom Circular Node with Label Above
const CircularNode = memo(({ data }: any) => {
  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Label floating above the node */}
      <div
        style={{
          position: "absolute",
          bottom: "100%",
          marginBottom: "6px",
          whiteSpace: "nowrap",
          fontFamily: "var(--sans)",
          fontSize: "9px",
          color: "var(--ink)",
          fontWeight: data.isCenter ? "600" : "400",
          background: "var(--paper-rail)",
          border: data.isCenter ? "1px solid var(--clay-rule)" : "1px solid var(--rule)",
          padding: "2px 6px",
          borderRadius: 0,
          boxShadow: data.isCenter ? "var(--shadow-sm)" : "none",
          pointerEvents: "none",
        }}
      >
        {data.label}
      </div>

      {/* The circle node itself */}
      <div
        style={{
          width: data.isCenter ? "12px" : "8px",
          height: data.isCenter ? "12px" : "8px",
          borderRadius: "50%",
          background: data.isCenter ? "var(--clay)" : "var(--paper-sunk)",
          border: data.isCenter ? "2px solid var(--clay)" : "1.5px solid var(--rule-strong)",
          boxShadow: data.isCenter ? "0 0 4px var(--clay-rule)" : "none",
        }}
      />

      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
});

const nodeTypes = {
  circular: CircularNode,
};

function SemanticVisualizerInner({
  selectedNote,
  notes,
  backlinks,
  onNodeClick,
}: SemanticVisualizerProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [controlsOpen, setControlsOpen] = useState(false);

  const handleNodeClick = (_event: React.MouseEvent, node: any) => {
    if (onNodeClick) {
      onNodeClick(node.id);
    }
  };

  const { nodes, edges } = useMemo(() => {
    if (!selectedNote) {
      return { nodes: [], edges: [] };
    }

    const noteMap = new Map(notes.map((n) => [n.id, n]));
    const centerId = selectedNote.id;

    // Collect all links and backlinks
    const outwardLinks = selectedNote.links ?? [];
    const uniqueConnections = Array.from(new Set([...outwardLinks, ...backlinks])).filter(
      (id) => id !== centerId
    );

    const nodesList: Node[] = [];
    const edgesList: Edge[] = [];

    // 1. Center node
    nodesList.push({
      id: centerId,
      type: "circular",
      data: { label: selectedNote.title || "Untitled", isCenter: true },
      position: { x: 150, y: 150 },
    });

    // 2. Position connected nodes in a circle around the center node
    const count = uniqueConnections.length;
    const radius = 100;

    uniqueConnections.forEach((connectedId, index) => {
      const angle = (2 * Math.PI * index) / count;
      const x = 150 + radius * Math.cos(angle);
      const y = 150 + radius * Math.sin(angle);

      const targetNote = noteMap.get(connectedId);
      const label = targetNote ? targetNote.title || "Untitled" : "Connected Note";

      nodesList.push({
        id: connectedId,
        type: "circular",
        data: { label, isCenter: false },
        position: { x, y },
      });

      // Draw directed edge
      const isOutward = outwardLinks.includes(connectedId);
      edgesList.push({
        id: `edge-${centerId}-${connectedId}`,
        source: isOutward ? centerId : connectedId,
        target: isOutward ? connectedId : centerId,
        animated: true,
        style: {
          stroke: "var(--clay-rule)",
          strokeWidth: 1.5,
        },
      });
    });

    return { nodes: nodesList, edges: edgesList };
  }, [selectedNote, notes, backlinks]);

  if (!selectedNote) {
    return (
      <div className="visualizer-empty">
        <span className="text-shimmer">Awaiting Mapping...</span>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "240px", border: "1px solid var(--rule)", position: "relative" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        nodesConnectable={false}
        nodesDraggable={true}
        zoomOnScroll={true}
        zoomOnDoubleClick={true}
        zoomOnPinch={true}
        panOnScroll={true}
        panOnDrag={true}
        fitView
        fitViewOptions={{ padding: 0.35 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--rule-strong)" gap={16} size={1} />
      </ReactFlow>

      {/* Floating Toggleable Control Menu */}
      <div
        className="visualizer-controls"
        style={{
          position: "absolute",
          bottom: "8px",
          right: "8px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          zIndex: 4,
          background: "var(--paper-rail)",
          border: "1px solid var(--rule)",
          padding: "2px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <button
          onClick={() => setControlsOpen(!controlsOpen)}
          title="Map Controls"
          className="material-symbols-outlined"
          style={{
            background: "none",
            border: "none",
            color: "var(--ink-2)",
            fontSize: "16px",
            width: "22px",
            height: "22px",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            transition: "color var(--dur) var(--ease)",
          }}
        >
          {controlsOpen ? "close" : "menu"}
        </button>

        {controlsOpen && (
          <>
            <div style={{ width: "1px", height: "14px", background: "var(--rule)" }} />
            <button
              onClick={() => void zoomIn()}
              title="Zoom In"
              className="material-symbols-outlined"
              style={{
                background: "none",
                border: "none",
                color: "var(--ink-2)",
                fontSize: "16px",
                width: "22px",
                height: "22px",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              zoom_in
            </button>
            <button
              onClick={() => void zoomOut()}
              title="Zoom Out"
              className="material-symbols-outlined"
              style={{
                background: "none",
                border: "none",
                color: "var(--ink-2)",
                fontSize: "16px",
                width: "22px",
                height: "22px",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              zoom_out
            </button>
            <button
              onClick={() => void fitView({ padding: 0.35, duration: 400 })}
              title="Center View"
              className="material-symbols-outlined"
              style={{
                background: "none",
                border: "none",
                color: "var(--ink-2)",
                fontSize: "16px",
                width: "22px",
                height: "22px",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              center_focus_strong
            </button>
          </>
        )}
      </div>

      <div
        className="visualizer-badge"
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          fontFamily: "var(--mono)",
          fontSize: "9px",
          color: "var(--ink-3)",
          background: "var(--paper)",
          border: "1px solid var(--rule)",
          padding: "2px 6px",
          zIndex: 4,
          pointerEvents: "none",
        }}
      >
        <span className="live" style={{ marginRight: "4px", color: "var(--clay)", animation: "pulse 1.2s infinite" }}>●</span>
        Active Mapping
      </div>
    </div>
  );
}

export default function SemanticVisualizer(props: SemanticVisualizerProps) {
  return (
    <ReactFlowProvider>
      <SemanticVisualizerInner {...props} />
    </ReactFlowProvider>
  );
}

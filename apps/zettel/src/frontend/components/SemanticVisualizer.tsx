import React, { useMemo } from "react";
import ReactFlow, { Background, type Node, type Edge } from "reactflow";
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
}

export default function SemanticVisualizer({
  selectedNote,
  notes,
  backlinks,
}: SemanticVisualizerProps) {
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

    // 1. Center node styling
    nodesList.push({
      id: centerId,
      data: { label: selectedNote.title || "Untitled" },
      position: { x: 150, y: 150 },
      style: {
        background: "var(--clay-tint)",
        border: "1px solid var(--clay-rule)",
        color: "var(--clay-strong)",
        fontWeight: "600",
        borderRadius: 0,
        fontFamily: "var(--sans)",
        fontSize: "11px",
        padding: "8px 12px",
        boxShadow: "var(--shadow-sm)",
      },
    });

    // 2. Position connected nodes in a circle around the center node
    const count = uniqueConnections.length;
    const radius = 110;

    uniqueConnections.forEach((connectedId, index) => {
      const angle = (2 * Math.PI * index) / count;
      const x = 150 + radius * Math.cos(angle);
      const y = 150 + radius * Math.sin(angle);

      const targetNote = noteMap.get(connectedId);
      const label = targetNote ? targetNote.title || "Untitled" : "Connected Note";

      nodesList.push({
        id: connectedId,
        data: { label },
        position: { x, y },
        style: {
          background: "var(--paper-rail)",
          border: "1px solid var(--rule)",
          color: "var(--ink)",
          borderRadius: 0,
          fontFamily: "var(--sans)",
          fontSize: "10px",
          padding: "6px 10px",
        },
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
        nodesConnectable={false}
        nodesDraggable={false}
        zoomOnScroll={false}
        zoomOnDoubleClick={false}
        zoomOnPinch={false}
        panOnScroll={false}
        panOnDrag={false}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--rule-strong)" gap={16} size={1} />
      </ReactFlow>
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
        }}
      >
        <span className="live" style={{ marginRight: "4px", color: "var(--clay)", animation: "pulse 1.2s infinite" }}>●</span>
        Active Mapping
      </div>
    </div>
  );
}

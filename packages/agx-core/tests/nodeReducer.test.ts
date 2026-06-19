import { describe, it, expect } from "vitest";
import { nodeReducer, NodeAction } from "../src/nodeReducer";
import { AgentNode } from "../src/types";

describe("nodeReducer", () => {
  const initialState: AgentNode[] = [
    { id: "1", label: "Node 1", status: "queued", progress: 0 },
    { id: "2", label: "Node 2", status: "running", progress: 50 },
  ];

  it("should update status and progress of an existing node", () => {
    const action: NodeAction = {
      type: "STATUS_UPDATE",
      id: "1",
      status: "running",
      progress: 10,
      detail: "Starting...",
    };
    const newState = nodeReducer(initialState, action);
    expect(newState[0]).toEqual({
      id: "1",
      label: "Node 1",
      status: "running",
      progress: 10,
      detail: "Starting...",
    });
  });

  it("should not change state if node ID does not exist", () => {
    const action: NodeAction = {
      type: "STATUS_UPDATE",
      id: "999",
      status: "running",
      progress: 10,
    };
    const newState = nodeReducer(initialState, action);
    expect(newState).toEqual(initialState);
  });

  it("should clear detail when not provided in STATUS_UPDATE", () => {
    const stateWithDetail: AgentNode[] = [
      { id: "1", label: "Node 1", status: "running", progress: 10, detail: "Old" },
    ];
    const action: NodeAction = {
      type: "STATUS_UPDATE",
      id: "1",
      status: "success",
      progress: 100,
    };
    const newState = nodeReducer(stateWithDetail, action);
    expect(newState[0].detail).toBeUndefined();
  });

  it("should reset the state with new nodes", () => {
    const newNodes: AgentNode[] = [{ id: "3", label: "Node 3", status: "success", progress: 100 }];
    const action: NodeAction = { type: "RESET", nodes: newNodes };
    const newState = nodeReducer(initialState, action);
    expect(newState).toEqual(newNodes);
  });
});

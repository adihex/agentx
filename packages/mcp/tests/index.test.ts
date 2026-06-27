/**
 * agentx-mcp — Unit tests for MCP server
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the MCP SDK before any imports
vi.mock("@modelcontextprotocol/sdk/server/index.js", () => {
  const MockServer = vi.fn(function () {
    return {
      setRequestHandler: vi.fn(),
      connect: vi.fn().mockResolvedValue(undefined),
    };
  });
  return { Server: MockServer };
});

vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
  StdioServerTransport: vi.fn(),
}));

vi.mock("@modelcontextprotocol/sdk/types.js", () => ({
  CallToolRequestSchema: Symbol("CallToolRequest"),
  ListToolsRequestSchema: Symbol("ListToolsRequest"),
  ErrorCode: { MethodNotFound: -32601, InvalidParams: -32602 },
  McpError: class McpError extends Error {
    constructor(
      public code: number,
      message: string,
    ) {
      super(message);
      this.name = "McpError";
    }
  },
}));

vi.mock("@agentx/orchestrator", () => ({
  OrchestratedSession: vi.fn(),
  ExecutionPlanSchema: {
    parse: vi.fn((p: any) => p),
  },
}));

describe("AgxMcpServer", () => {
  it("can be imported and creates server instance", async () => {
    const { Server } = await import("@modelcontextprotocol/sdk/server/index.js");

    // Import the module — it creates a server instance
    const mod = await import("../src/index");
    expect(mod).toBeDefined();

    // The Server constructor should have been called
    expect(Server).toHaveBeenCalled();
  });
});

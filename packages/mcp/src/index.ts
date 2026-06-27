import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import {
  OrchestratedSession,
  ExecutionPlanSchema,
  type OrchestrationEvent,
} from "@agentx/orchestrator";

/**
 * AgxMcpServer
 *
 * Exposes the @agentx/orchestrator as an MCP server.
 * This allows agents like Codex to generate and execute DAG plans.
 */
class AgxMcpServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "agentx-orchestrator",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupTools();
  }

  private setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "execute_plan",
          description:
            "Execute a DAG orchestration plan (ExecutionPlan). The agent should generate the plan (steps, dependencies, criteria) before calling this.",
          inputSchema: {
            type: "object",
            properties: {
              plan: {
                type: "object",
                description: "The ExecutionPlan object containing steps and dependencies.",
              },
            },
            required: ["plan"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== "execute_plan") {
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
      }

      const planArg = request.params.arguments?.plan;
      if (!planArg) {
        throw new McpError(ErrorCode.InvalidParams, "Missing plan argument");
      }

      try {
        // Validate plan against orchestrator schema
        const plan = ExecutionPlanSchema.parse(planArg);

        const session = new OrchestratedSession();
        const bus = session.getBus();

        // Optional: Stream events to logs or return them
        const events: OrchestrationEvent[] = [];
        bus.onAny((e) => events.push(e));

        console.error(`[MCP] Starting orchestration for plan: ${plan.planId}`);
        await session.start(plan);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "completed",
                  planId: plan.planId,
                  summary: "Orchestration finished successfully.",
                  eventCount: events.length,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Orchestration failed: ${message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /** Start the MCP server using stdio transport. */
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("AGX MCP Server running on stdio");
  }
}

const server = new AgxMcpServer();
server.run().catch(console.error);

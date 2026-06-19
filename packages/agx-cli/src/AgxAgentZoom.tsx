import React from "react";

// Primitive components
const Box = (props: any) => (
  // @ts-expect-error custom TUI intrinsic element
  <box {...props} />
);
const Text = (props: any) => <text {...props} />;

export const AgxAgentZoomCLI = () => {
  return (
    <Box flexDirection="column" width="100%" height="100%">
      {/* Top Navbar */}
      <Box borderStyle="single" borderColor="cyan" paddingX={1} justifyContent="space-between">
        <Text bold color="cyan">
          AGX_CORE // AGENT DETAIL
        </Text>
        <Box gap={2}>
          <Text color="green">AGENT_01_ACTIVE</Text>
        </Box>
      </Box>

      {/* Main Content */}
      <Box flexGrow={1} flexDirection="row">
        {/* Center Workspace (Thoughts & Tools) */}
        <Box flexGrow={1} flexDirection="column">
          {/* Top: Thought Stream */}
          <Box
            borderStyle="single"
            borderColor="gray"
            flexGrow={1}
            flexDirection="column"
            paddingX={1}
          >
            <Text color="gray">[0] thought_stream.log</Text>
            <Box flexDirection="column" marginTop={1}>
              <Text dimColor>
                14:32:01.045{" "}
                <Text color="magenta" bold>
                  THOUGHT
                </Text>
              </Text>
              <Text> Analyzing user request: "Optimize database query performance"...</Text>
              <Text dimColor marginTop={1}>
                14:32:01.102{" "}
                <Text color="cyan" bold>
                  SYSTEM
                </Text>
              </Text>
              <Text> Tool call scheduled: get_slow_query_log()</Text>
            </Box>
          </Box>

          {/* Bottom: Tool Execution History */}
          <Box
            borderStyle="single"
            borderColor="gray"
            height={15}
            flexDirection="column"
            paddingX={1}
          >
            <Text color="gray">[1] tool_execution.sys</Text>
            <Box flexDirection="column" marginTop={1}>
              <Box gap={2}>
                <Text color="green">✓</Text> <Text color="cyan">read_file</Text> <Text>120ms</Text>{" "}
                <Text dimColor>path: "/opt/app/config.yml"</Text>
              </Box>
              <Box gap={2}>
                <Text color="green">✓</Text> <Text color="cyan">get_slow_query_log</Text>{" "}
                <Text>1.4s</Text> <Text dimColor>limit: 10</Text>
              </Box>
              <Box gap={2}>
                <Text color="cyan">↻</Text> <Text color="cyan">describe_schema</Text>{" "}
                <Text>running...</Text> <Text dimColor>table: "orders"</Text>
              </Box>
              <Box gap={2}>
                <Text color="red">✗</Text> <Text color="cyan">check_auth</Text>{" "}
                <Text color="red">timeout</Text>{" "}
                <Text dimColor>user: "system_cron" [Press Enter to INSPECT]</Text>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Right Sidebar: Memory Context */}
        <Box borderStyle="single" borderColor="gray" width={40} flexDirection="column" paddingX={1}>
          <Box justifyContent="space-between">
            <Text color="gray">[2] memory_ctx.dat</Text>
            <Text dimColor>[M] EXPAND</Text>
          </Box>

          <Box flexDirection="column" marginTop={1} gap={1}>
            <Text bold color="gray">
              Session Variables
            </Text>
            <Box justifyContent="space-between">
              <Text color="cyan">task_id</Text> <Text>REQ-992A</Text>
            </Box>
            <Box justifyContent="space-between">
              <Text color="cyan">auth_level</Text> <Text>admin</Text>
            </Box>
            <Box justifyContent="space-between">
              <Text color="cyan">current_step</Text> <Text>14</Text>
            </Box>
          </Box>

          <Box flexDirection="column" marginTop={2}>
            <Text bold color="gray">
              Active Goal Vector
            </Text>
            <Text>
              Identify root cause of latency spike in database cluster and propose index
              optimization.
            </Text>
          </Box>

          <Box flexDirection="column" marginTop={2}>
            <Text bold color="gray">
              Vector Search DB
            </Text>
            <Text color="cyan">
              doc_id: idx_best_practices <Text color="green">(sim: 0.89)</Text>
            </Text>
            <Text dimColor>PostgreSQL indexing strategies...</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

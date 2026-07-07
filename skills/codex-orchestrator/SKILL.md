---
name: codex-orchestrator
description: Use when a complex task needs to be divided into a DAG (Directed Acyclic Graph) of sub-tasks for structured execution.
---

# Codex Orchestrator Skill

## Overview

This skill teaches Codex how to use the AGX Orchestrator to execute complex, multi-step goals by breaking them down into a structured `ExecutionPlan`.

## When to Use

- Use when a user request is too large for a single prompt response.
- Use when tasks have clear dependencies (e.g., "Build X, then test X").
- Use when automated review or remediation cycles are required.

## Core Pattern: Plan → Execute

1. **Analyze Prompt**: Identify the high-level goal and required steps.
2. **Generate DAG**: Create an `ExecutionPlan` JSON object.
3. **Invoke Tool**: Call `execute_plan` with the generated plan.

### ExecutionPlan Structure

```json
{
  "planId": "unique-id",
  "goal": "Descriptive goal",
  "createdAt": "2026-05-07T...",
  "steps": [
    {
      "id": "step-1",
      "description": "Task description",
      "dependencies": [],
      "acceptanceCriteria": ["Condition 1"]
    },
    {
      "id": "step-2",
      "description": "Dependent task",
      "dependencies": ["step-1"]
    }
  ],
  "successCriteria": ["Overall success condition"],
  "reviewConfig": {
    "passes": [{ "id": "quality", "checklist": ["Check A"] }],
    "maxTotalReviewRounds": 3
  }
}
```

## Implementation via MCP

Codex should use the `execute_plan` tool provided by the `agentx-orchestrator` MCP server.

## Common Mistakes

- **Circular Dependencies**: Ensure step IDs do not form a cycle.
- **Missing IDs**: Every dependency must refer to an existing step ID.
- **Vague Criteria**: Acceptance criteria should be objective and verifiable.

## Quick Reference

| Property       | Type     | Description                             |
| -------------- | -------- | --------------------------------------- |
| `planId`       | string   | Stable identifier for the session       |
| `steps`        | array    | List of `PlanStep` objects              |
| `dependencies` | string[] | List of step IDs that must finish first |

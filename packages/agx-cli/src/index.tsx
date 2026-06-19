import React from "react";
import { createRoot, useRenderer } from "@opentui/react";
import { createCliRenderer } from "@opentui/core";
import { AgxOrchestratorCLI } from "./AgxOrchestrator";

const App = () => {
  const renderer = useRenderer();
  const exit = () => renderer.destroy();
  return <AgxOrchestratorCLI onExit={exit} />;
};

const renderer = await createCliRenderer();
createRoot(renderer).render(<App />);

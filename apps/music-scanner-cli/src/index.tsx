import React from "react";
import { createRoot, useRenderer } from "@opentui/react";
import { createCliRenderer } from "@opentui/core";
import { MusicScannerCLI } from "./MusicScannerCLI";

const App = () => {
  const renderer = useRenderer();
  const exit = () => renderer.destroy();
  return <MusicScannerCLI onExit={exit} />;
};

const renderer = await createCliRenderer();
createRoot(renderer).render(<App />);

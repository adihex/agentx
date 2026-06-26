import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  run: {
    tasks: {
      build: {
        command: "tsc -b && vite build",
        output: ["dist/**"],
        input: [{ auto: true }, "!dist/**", "!node_modules/**"],
        dependsOn: ["@agentx/adp#build", "@agentx/core#build", "@agentx/agx-core#build"],
      },
    },
  },
} as any);

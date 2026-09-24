import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    allowedHosts: [".preview.niteshift.dev"],
    proxy: {
      "/adp": { target: "ws://localhost:9222", ws: true },
    },
  },
  run: {
    tasks: {
      build: {
        command: "tsc -b && vite build",
        output: ["dist/**"],
        input: [{ auto: true }, "!dist/**", "!node_modules/**"],
        dependsOn: ["@agentx/agx-core#build"],
      },
    },
  },
} as any);

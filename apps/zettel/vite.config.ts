import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";

const clientPort = process.env.VITE_PORT ? parseInt(process.env.VITE_PORT, 10) : 5173;
const serverPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 5174;

export default defineConfig({
  base: "/zettel/",
  plugins: [react()],
  server: {
    port: clientPort,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: `http://localhost:${serverPort}`,
        changeOrigin: true,
      },
      "/adp": {
        target: `ws://localhost:${serverPort}`,
        ws: true,
      },
    },
  },
  run: {
    tasks: {
      build: {
        command: "tsc -b && tsc -p tsconfig.server.json && vite build",
        output: ["dist/**", "dist-server/**"],
        input: [{ auto: true }, "!dist/**", "!dist-server/**", "!node_modules/**"],
        dependsOn: ["@agentx/adp#build", "@agentx/core#build", "@agentx/agx-core#build"],
      },
    },
  },
});

import { defineConfig } from "vite";
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
});

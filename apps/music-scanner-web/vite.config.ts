import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  run: {
    tasks: {
      build: {
        command: "vite build",
        output: ["dist/**"],
        input: [{ auto: true }, "!dist/**", "!node_modules/**"],
      },
    },
  },
} as any);

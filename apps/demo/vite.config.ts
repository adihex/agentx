import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: "tsc",
        output: ["dist/**"],
        input: [{ auto: true }, "src/**", "!dist/**", "!node_modules/**"],
        dependsOn: ["@agentx/adp#build", "@agentx/core#build"],
      },
    },
  },
});

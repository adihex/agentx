import { createStartHandler } from "@tanstack/start/server";
import { createRouter } from "./router";

export default createStartHandler({
  createRouter,
});

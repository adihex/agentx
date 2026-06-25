import { hc } from "hono/client";
import type { AppType } from "../index.js";

export const api = hc<AppType>(`${window.location.origin}/api`);

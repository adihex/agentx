import { hc } from "hono/client";
import type { AppType } from "../index.js";

const API_BASE = import.meta.env.PROD
  ? "https://zettel-service-594828290101.asia-south1.run.app"
  : window.location.origin;

export const api = hc<AppType>(`${API_BASE}/api`);

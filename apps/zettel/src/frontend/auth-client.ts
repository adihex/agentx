import { createAuthClient } from "better-auth/react";

const API_BASE = import.meta.env.PROD
  ? "https://zettel-service-594828290101.asia-south1.run.app"
  : window.location.origin;

export const authClient: any = createAuthClient({
  baseURL: API_BASE,
  fetchOptions: {
    credentials: "include",
  },
});

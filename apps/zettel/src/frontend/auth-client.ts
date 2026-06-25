import { createAuthClient } from "better-auth/react";

export const authClient: any = createAuthClient({
  baseURL: window.location.origin,
});

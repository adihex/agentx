import { describe, it, expect } from "vitest";
import { auth } from "./auth.js";

describe("Better Auth configuration", () => {
  it("should have email/password enabled", () => {
    expect(auth.options.emailAndPassword?.enabled).toBe(true);
  });

  it("should have cross-subdomain cookies enabled for cross-origin support", () => {
    expect(auth.options.advanced?.crossSubdomainCookies?.enabled).toBe(true);
  });

  it("should have cookie prefix set to avoid conflicts", () => {
    expect(auth.options.advanced?.cookiePrefix).toBe("agentx");
  });

  it("should have GitHub Pages in trusted origins", () => {
    expect(auth.options.trustedOrigins).toContain("https://adihex.github.io");
  });

  it("should have localhost dev origins in trusted origins", () => {
    expect(auth.options.trustedOrigins).toContain("http://localhost:5173");
    expect(auth.options.trustedOrigins).toContain("http://localhost:5193");
  });

  it("should use libsql (Turso-compatible) as database dialect", () => {
    expect(auth.options.database?.type).toBe("sqlite");
    expect(auth.options.database?.dialect).toBeDefined();
  });

  it("should have session cookie cache enabled", () => {
    expect(auth.options.session?.cookieCache?.enabled).toBe(true);
    expect(auth.options.session?.cookieCache?.maxAge).toBe(300); // 5 * 60
  });

  it("should set SameSite=None and Secure on session cookies for cross-origin", () => {
    expect(auth.options.advanced?.cookies?.session_token?.attributes?.sameSite).toBe("none");
    expect(auth.options.advanced?.cookies?.session_token?.attributes?.secure).toBe(true);
    expect(auth.options.advanced?.cookies?.session_data?.attributes?.sameSite).toBe("none");
    expect(auth.options.advanced?.cookies?.session_data?.attributes?.secure).toBe(true);
  });
});

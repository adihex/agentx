import { betterAuth } from "better-auth";
import { dash } from "@better-auth/infra";
import { bearer } from "better-auth/plugins";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { client } from "./store.js";

export const auth = betterAuth({
  logger: {
    level: "debug",
  },
  database: {
    dialect: new LibsqlDialect({
      client: client as any,
    }),
    type: "sqlite",
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [dash(), bearer()],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  advanced: {
    cookiePrefix: "agentx",
    crossSubdomainCookies: {
      enabled: true,
    },
    cookies: {
      session_token: {
        attributes: {
          sameSite: "none",
          secure: true,
        },
      },
      session_data: {
        attributes: {
          sameSite: "none",
          secure: true,
        },
      },
    },
  },
  trustedOrigins: [
    "http://localhost:5173",
    "http://localhost:5193",
    "https://adihex.github.io",
    ...(process.env.TRUSTED_ORIGINS ? process.env.TRUSTED_ORIGINS.split(",") : []),
  ],
});

import { betterAuth } from "better-auth";
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
  trustedOrigins: [
    "http://localhost:5173",
    "http://localhost:5193",
    ...(process.env.TRUSTED_ORIGINS ? process.env.TRUSTED_ORIGINS.split(",") : []),
  ],
});

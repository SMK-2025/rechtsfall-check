import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getSiteUrl } from "./site-url";
import { getDb } from "../db";
import { authAccounts, authSessions, authUsers, authVerifications } from "../db/schema";
export const isAuthConfigured = Boolean(process.env.BETTER_AUTH_SECRET && process.env.DATABASE_URL);
export const auth = betterAuth({
  appName: "Rechtsfall KI",
  secret: process.env.BETTER_AUTH_SECRET ?? "build-only-disabled-auth-secret-change-before-production",
  baseURL: process.env.BETTER_AUTH_URL ?? getSiteUrl(),
  database: isAuthConfigured ? drizzleAdapter(getDb(), {
    provider: "pg",
    schema: { user: authUsers, session: authSessions, account: authAccounts, verification: authVerifications },
  }) : undefined,
  emailAndPassword: { enabled: true, minPasswordLength: 10 },
  socialProviders: process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET ? {
    github: { clientId: process.env.GITHUB_CLIENT_ID!, clientSecret: process.env.GITHUB_CLIENT_SECRET! },
  } : {},
  session: { expiresIn: 60 * 60 * 8, updateAge: 60 * 30, cookieCache: { enabled: true, maxAge: 60 * 5 } },
  advanced: { useSecureCookies: process.env.NODE_ENV === "production" },
});

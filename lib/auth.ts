import { betterAuth } from "better-auth";
import { getSiteUrl } from "./site-url";
export const isAuthConfigured = Boolean(process.env.BETTER_AUTH_SECRET && process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
export const auth = betterAuth({
  appName: "Rechtsfall KI",
  secret: process.env.BETTER_AUTH_SECRET ?? "build-only-disabled-auth-secret-change-before-production",
  baseURL: process.env.BETTER_AUTH_URL ?? getSiteUrl(),
  socialProviders: isAuthConfigured ? {
    github: { clientId: process.env.GITHUB_CLIENT_ID!, clientSecret: process.env.GITHUB_CLIENT_SECRET! },
  } : {},
  session: { expiresIn: 60 * 60 * 8, updateAge: 60 * 30, cookieCache: { enabled: true, maxAge: 60 * 5 } },
  advanced: { useSecureCookies: process.env.NODE_ENV === "production" },
});

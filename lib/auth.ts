import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getSiteUrl } from "./site-url";
import { getDb } from "../db";
import { authAccounts, authSessions, authUsers, authVerifications } from "../db/schema";
import { sendTransactionalEmail } from "./email/sendgrid";
export const isAuthConfigured = Boolean(process.env.BETTER_AUTH_SECRET && process.env.DATABASE_URL);
export const auth = betterAuth({
  appName: "Rechtsfall Check",
  secret: process.env.BETTER_AUTH_SECRET ?? "build-only-disabled-auth-secret-change-before-production",
  baseURL: process.env.BETTER_AUTH_URL ?? getSiteUrl(),
  database: isAuthConfigured ? drizzleAdapter(getDb(), {
    provider: "pg",
    schema: { user: authUsers, session: authSessions, account: authAccounts, verification: authVerifications },
  }) : undefined,
  emailAndPassword: {
    enabled: true, minPasswordLength: 10, maxPasswordLength: 128,
    requireEmailVerification: true, resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendTransactionalEmail({ kind: "reset", to: user.email, name: user.name, actionUrl: url });
    },
  },
  emailVerification: {
    sendOnSignUp: true, sendOnSignIn: true, autoSignInAfterVerification: true, expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      await sendTransactionalEmail({ kind: "verify", to: user.email, name: user.name, actionUrl: url });
    },
    afterEmailVerification: async user => {
      try {
        await sendTransactionalEmail({ kind: "welcome", to: user.email, name: user.name });
      } catch {
        // Eine ausgefallene Willkommensmail darf die erfolgreiche Verifikation nicht zurückrollen.
      }
    },
  },
  session: { expiresIn: 60 * 60 * 8, updateAge: 60 * 30, cookieCache: { enabled: true, maxAge: 60 * 5 } },
  advanced: { useSecureCookies: process.env.NODE_ENV === "production" },
});

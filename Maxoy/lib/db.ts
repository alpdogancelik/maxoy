import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __maxoy_prisma: PrismaClient | undefined;
}

function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    // Keep a loud warning but avoid crashing at import-time (Next builds import server code).
    // Routes will still fail fast when Prisma tries to connect.
    // eslint-disable-next-line no-console
    console.warn("DATABASE_URL is not set. Prisma queries will fail until configured.");
  }

  if (process.env.NODE_ENV === "production") {
    return new PrismaClient();
  }

  if (!globalThis.__maxoy_prisma) {
    globalThis.__maxoy_prisma = new PrismaClient();
  }
  return globalThis.__maxoy_prisma;
}

export const prisma = getPrismaClient();


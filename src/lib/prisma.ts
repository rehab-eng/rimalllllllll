import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Ensure Cloudflare bundling keeps Prisma query compiler runtime modules.
import "@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs";
import "@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs";

type CloudflareEnv = {
  DATABASE_URL?: string;
};

export const isDatabaseConfigured = (): boolean =>
  Boolean(getDatabaseUrl()?.trim());

const getDatabaseUrl = (): string | undefined => {
  const processEnvUrl = process.env.DATABASE_URL?.trim();
  if (processEnvUrl) {
    return processEnvUrl;
  }

  try {
    const cloudflareEnv = getCloudflareContext().env as CloudflareEnv;
    const cloudflareUrl = cloudflareEnv.DATABASE_URL?.trim();
    if (cloudflareUrl) {
      return cloudflareUrl;
    }
  } catch {
    // Not running in Cloudflare runtime context.
  }

  return undefined;
};

const createPrismaClient = (): PrismaClient => {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new Error("Missing environment variable: DATABASE_URL");
  }

  return new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
};

type PrismaClientSingleton = PrismaClient;

const globalForPrisma = globalThis as typeof globalThis & {
  prisma: PrismaClientSingleton | undefined;
};

export const getPrisma = (): PrismaClientSingleton => {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
};

export default getPrisma;

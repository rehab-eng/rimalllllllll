import { cache } from "react";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Ensure Cloudflare bundling keeps Prisma query compiler runtime modules.
import "@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs";
import "@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs";

type CloudflareEnv = {
  DIRECT_DATABASE_URL?: string;
  DATABASE_URL?: string;
};

export const isDatabaseConfigured = (): boolean =>
  Boolean(getDatabaseUrl());

const normalizeConnectionString = (value: string | undefined): string | undefined => {
  const normalized = value?.trim();
  if (!normalized) {
    return undefined;
  }

  return normalized.startsWith("postgres://")
    ? `postgresql://${normalized.slice("postgres://".length)}`
    : normalized;
};

const getProcessEnvDatabaseUrl = (): string | undefined =>
  normalizeConnectionString(process.env.DIRECT_DATABASE_URL) ??
  normalizeConnectionString(process.env.DATABASE_URL);

const getCloudflareEnvDatabaseUrl = (): string | undefined => {
  try {
    const cloudflareEnv = getCloudflareContext().env as CloudflareEnv;
    return (
      normalizeConnectionString(cloudflareEnv.DIRECT_DATABASE_URL) ??
      normalizeConnectionString(cloudflareEnv.DATABASE_URL)
    );
  } catch {
    // Not running inside Cloudflare runtime context.
    return undefined;
  }
};

const getDatabaseUrl = (): string | undefined => {
  return getProcessEnvDatabaseUrl() ?? getCloudflareEnvDatabaseUrl();
};

const createPrismaClient = (): PrismaClient => {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new Error(
      "Missing environment variable: DATABASE_URL (or DIRECT_DATABASE_URL)",
    );
  }

  // Keep connection reuse low for Cloudflare Workers isolates.
  const adapter = new PrismaNeon({
    connectionString,
    maxUses: 1,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
};

export const getPrisma = cache(() => createPrismaClient());

export default getPrisma;

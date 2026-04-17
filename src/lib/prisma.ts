import { neon } from "@neondatabase/serverless";

type CloudflareEnv = {
  DIRECT_URL?: string;
  DIRECT_DATABASE_URL?: string;
  DATABASE_URL?: string;
};

export type SqlClient = ReturnType<typeof neon>;

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
  normalizeConnectionString(process.env.DIRECT_URL) ??
  normalizeConnectionString(process.env.DIRECT_DATABASE_URL) ??
  normalizeConnectionString(process.env.DATABASE_URL);

const getCloudflareEnvDatabaseUrl = async (): Promise<string | undefined> => {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const cloudflareEnv = getCloudflareContext().env as CloudflareEnv;

    return (
      normalizeConnectionString(cloudflareEnv.DIRECT_URL) ??
      normalizeConnectionString(cloudflareEnv.DIRECT_DATABASE_URL) ??
      normalizeConnectionString(cloudflareEnv.DATABASE_URL)
    );
  } catch {
    return undefined;
  }
};

const resolveDatabaseUrl = async (): Promise<string | undefined> =>
  getProcessEnvDatabaseUrl() ?? (await getCloudflareEnvDatabaseUrl());

const createSqlClient = async (): Promise<SqlClient> => {
  const connectionString = await resolveDatabaseUrl();
  if (!connectionString) {
    throw new Error(
      "Missing environment variable: DATABASE_URL (or DIRECT_DATABASE_URL / DIRECT_URL)",
    );
  }

  return neon(connectionString);
};

const globalForSql = globalThis as typeof globalThis & {
  sqlPromise: Promise<SqlClient> | undefined;
};

export const getSql = async (): Promise<SqlClient> => {
  globalForSql.sqlPromise ??= createSqlClient();
  return globalForSql.sqlPromise;
};

export const isDatabaseConfigured = async (): Promise<boolean> =>
  Boolean(await resolveDatabaseUrl());

// Backward-compatibility alias while migrating call sites.
export const getPrisma = getSql;

export default getSql;

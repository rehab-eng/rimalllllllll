type CloudflareEnv = {
  DIRECT_URL?: string;
  DIRECT_DATABASE_URL?: string;
  DATABASE_URL?: string;
};

type PrismaClientSingleton = import("../generated/prisma/client").PrismaClient;

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
    // Lazy import: avoid crashing module evaluation before request handling.
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const cloudflareEnv = getCloudflareContext().env as CloudflareEnv;

    return (
      normalizeConnectionString(cloudflareEnv.DIRECT_URL) ??
      normalizeConnectionString(cloudflareEnv.DIRECT_DATABASE_URL) ??
      normalizeConnectionString(cloudflareEnv.DATABASE_URL)
    );
  } catch {
    // Not running in Cloudflare runtime context (or package unavailable).
    return undefined;
  }
};

const getDatabaseUrl = async (): Promise<string | undefined> => {
  return getProcessEnvDatabaseUrl() ?? (await getCloudflareEnvDatabaseUrl());
};

export const isDatabaseConfigured = (): boolean => Boolean(getProcessEnvDatabaseUrl());

const createPrismaClient = async (): Promise<PrismaClientSingleton> => {
  const connectionString = await getDatabaseUrl();
  if (!connectionString) {
    throw new Error(
      "Missing environment variable: DATABASE_URL (or DIRECT_DATABASE_URL / DIRECT_URL)",
    );
  }

  const [{ PrismaNeon }, { PrismaClient }] = await Promise.all([
    import("@prisma/adapter-neon"),
    import("../generated/prisma/client"),
  ]);

  const adapter = new PrismaNeon({
    connectionString,
    maxUses: 1,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
};

const globalForPrisma = globalThis as typeof globalThis & {
  prismaPromise: Promise<PrismaClientSingleton> | undefined;
};

export const getPrisma = async (): Promise<PrismaClientSingleton> => {
  globalForPrisma.prismaPromise ??= createPrismaClient();
  return globalForPrisma.prismaPromise;
};

export default getPrisma;

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client";

export const isDatabaseConfigured = (): boolean =>
  Boolean(getDatabaseUrl()?.trim());

const getDatabaseUrl = (): string | undefined => {
  const runtimeEnv = process.env;

  return runtimeEnv.DATABASE_URL;
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

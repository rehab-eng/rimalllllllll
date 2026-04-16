import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client";

export const isDatabaseConfigured = (): boolean =>
  Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim());

const createPrismaClient = (): PrismaClient => {
  const connectionString = process.env.DATABASE_URL;
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

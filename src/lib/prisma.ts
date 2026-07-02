import { PrismaClient } from ".prisma/client/index";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Auto-patch database schema to resolve missing prefSyncFailures column (P2022)
prisma.$executeRawUnsafe(`
  ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "prefSyncFailures" BOOLEAN DEFAULT true;
`)
  .then(() => {
    console.log("Prisma auto-patch: 'prefSyncFailures' column verified or added successfully.");
  })
  .catch((err) => {
    console.warn("Prisma auto-patch warning (prefSyncFailures):", err.message || err);
  });

export default prisma;


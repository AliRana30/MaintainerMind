import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("Executing raw SQL database schema migrations...");
    
    // 1. Create OrgPlan enum type if it does not exist
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrgPlan') THEN
              CREATE TYPE "OrgPlan" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');
          END IF;
      END$$;
    `);

    // 2. Alter User table to add missing columns
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "plan" "OrgPlan" NOT NULL DEFAULT 'FREE';
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "prefSyncFailures" BOOLEAN NOT NULL DEFAULT true;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "prefNewPRNeedContext" BOOLEAN NOT NULL DEFAULT true;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "prefWeeklyDigest" BOOLEAN NOT NULL DEFAULT false;
    `);

    // 3. Create Notification table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Notification" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "repoId" TEXT,
          "read" BOOLEAN NOT NULL DEFAULT false,
          "type" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "payload" JSONB NOT NULL DEFAULT '{}',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
      );
    `);

    // 4. Add foreign keys to Notification table if they don't exist
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'Notification_userId_fkey'
          ) THEN
              ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
      END$$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'Notification_repoId_fkey'
          ) THEN
              ALTER TABLE "Notification" ADD CONSTRAINT "Notification_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "Repository"("id") ON DELETE SET NULL ON UPDATE CASCADE;
          END IF;
      END$$;
    `);

    // 5. Create indices if not exists
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Notification_read_idx" ON "Notification"("read");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");
    `);

    console.log("Database schema migrations completed successfully!");
    return NextResponse.json({
      success: true,
      message: "Database schema migrations completed successfully!"
    });
  } catch (err: any) {
    console.error("Migration failed:", err);
    return NextResponse.json({
      success: false,
      error: err.message,
    });
  }
}

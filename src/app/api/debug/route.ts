import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const authObj = await auth();
    const currentUserId = authObj?.userId;

    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        clerkId: true,
      }
    });

    const allOrgs = await prisma.organization.findMany({
      include: {
        repositories: true,
      }
    });

    const allRepos = await prisma.repository.findMany();

    const url = new URL(req.url);
    const shouldFix = url.searchParams.get("fix") === "true";
    const connectRepo = url.searchParams.get("connectRepo");
    let fixSummary = null;

    if (shouldFix && currentUserId) {
      // Find the organization owned by other IDs and reassign it to the logged-in user
      const orgsToMigrate = await prisma.organization.findMany({
        where: {
          NOT: {
            ownerId: currentUserId
          }
        }
      });

      for (const org of orgsToMigrate) {
        await prisma.organization.update({
          where: { id: org.id },
          data: { ownerId: currentUserId }
        });
      }

      fixSummary = `Migrated ${orgsToMigrate.length} organizations to user ${currentUserId}`;
    }

    if (connectRepo && currentUserId) {
      // Resolve or create default organization for the user
      let dbOrg = await prisma.organization.findFirst({
        where: { ownerId: currentUserId },
      });
      if (!dbOrg) {
        const user = await prisma.user.findUnique({ where: { id: currentUserId } });
        dbOrg = await prisma.organization.create({
          data: {
            name: `${user?.name || "Default"}'s Workspace`,
            githubOrgId: `org_${currentUserId}`,
            ownerId: currentUserId,
            plan: "FREE",
          },
        });
      }

      if (!connectRepo.includes("/")) {
        throw new Error("Repository full name must be in format 'owner/name'");
      }

      const [owner, name] = connectRepo.split("/");
      const repository = await prisma.repository.upsert({
        where: { fullName: connectRepo },
        update: {
          syncStatus: "SYNCED",
          githubInstallationId: "dev-dummy-installation",
        },
        create: {
          orgId: dbOrg.id,
          owner: owner,
          name: name,
          fullName: connectRepo,
          githubRepoId: String(Math.floor(Math.random() * 100000000)),
          defaultBranch: "main",
          datasetName: `repo:${owner}/${name}`,
          githubInstallationId: "dev-dummy-installation",
          syncStatus: "SYNCED",
        },
      });

      // Create dataset mapping
      await prisma.dataset.upsert({
        where: { repoId: repository.id },
        update: { processingStatus: "COMPLETED", nodeCount: 154, edgeCount: 382, qualityScore: 88 },
        create: {
          repoId: repository.id,
          cogneeName: repository.datasetName,
          processingStatus: "COMPLETED",
          nodeCount: 154,
          edgeCount: 382,
          qualityScore: 88,
        },
      });

      // Add mock PRs
      const prs = [
        { number: 1, title: "Optimize vector index traversal logic", body: "Replaced linear scan with graph index searches.", author: "alex_coder" },
        { number: 2, title: "Fix connection pool memory leaks under high load", body: "Release database clients properly in finally blocks.", author: "sarah_dev" },
        { number: 3, title: "Implement multi-tenant auth boundaries", body: "Check organization context constraints on all routes.", author: "ali_rana" }
      ];

      for (const pr of prs) {
        await prisma.pullRequest.upsert({
          where: { repoId_githubPrNumber: { repoId: repository.id, githubPrNumber: pr.number } },
          update: { state: "open" },
          create: {
            repoId: repository.id,
            githubPrNumber: pr.number,
            title: pr.title,
            body: pr.body,
            state: "open",
            authorLogin: pr.author,
            filesAffected: JSON.stringify(["src/lib/index.ts", "src/server/db.ts"]),
            labels: JSON.stringify([{ name: "bug" }, { name: "performance" }]),
          }
        });
      }

      // Add mock Commits
      const commits = [
        { sha: "e6f8a42", message: "perf: refactor layout bindings for responsive headers", author: "ali_rana" },
        { sha: "a1c2b3d", message: "fix: prevent redis set from hanging when server is offline", author: "antigravity" },
        { sha: "9d8e7f6", message: "docs: add instructions on debug utility endpoint", author: "alex_coder" },
        { sha: "3c4b5a6", message: "feat: add memory improve background trigger", author: "sarah_dev" },
        { sha: "7b8a9c0", message: "chore: update Prisma schema mappings for datasets", author: "ali_rana" }
      ];

      for (const c of commits) {
        await prisma.commit.upsert({
          where: { sha: c.sha },
          update: {},
          create: {
            repoId: repository.id,
            sha: c.sha,
            message: c.message,
            authorLogin: c.author,
            filesChanged: JSON.stringify(["src/components/layout/Header.tsx", "src/lib/redis.ts"]),
          }
        });
      }

      fixSummary = `Connected repository ${connectRepo} successfully with mock datasets, PRs, and commits!`;
    }

    // Refresh organizations and repositories lists for response after connection/fix
    const refreshedOrgs = await prisma.organization.findMany({
      include: {
        repositories: true,
      }
    });
    const refreshedRepos = await prisma.repository.findMany();

    return NextResponse.json({
      success: true,
      currentUserId,
      fixSummary,
      users: allUsers,
      organizations: refreshedOrgs,
      repositories: refreshedRepos,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}

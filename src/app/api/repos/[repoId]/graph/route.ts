import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis, getCachedValue, setCachedValue } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    const { repoId } = await params;
    
    // Parse query params
    const url = new URL(req.url);
    const range = url.searchParams.get("range") || "all";
    const nodeTypesParam = url.searchParams.get("node_types") || "";
    const selectedTypes = nodeTypesParam ? nodeTypesParam.split(",") : [];

    let dbRepoId = repoId;
    if (repoId.includes("-")) {
      const parts = repoId.split("-");
      const owner = parts[0];
      const name = parts.slice(1).join("-");
      const foundRepo = await prisma.repository.findFirst({
        where: {
          OR: [
            { id: repoId },
            { fullName: `${owner}/${name}` },
            { name: name }
          ]
        }
      });
      if (foundRepo) {
        dbRepoId = foundRepo.id;
      }
    } else {
      const foundRepo = await prisma.repository.findFirst({
        where: {
          OR: [
            { id: repoId },
            { name: repoId }
          ]
        }
      });
      if (foundRepo) {
        dbRepoId = foundRepo.id;
      }
    }

    // Build Cache Key including filters
    const cacheKey = `graph:${dbRepoId}:${range}:${nodeTypesParam}`;
    const cached = await getCachedValue(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }

    // Build date filter if range !== 'all'
    let dateFilter: any = undefined;
    if (range !== "all") {
      const now = new Date();
      let days = 30;
      if (range === "7d") days = 7;
      else if (range === "90d") days = 90;
      dateFilter = {
        gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000),
      };
    }

    const wherePrs: any = { repoId: dbRepoId };
    const whereIssues: any = { repoId: dbRepoId };
    const whereCommits: any = { repoId: dbRepoId };

    if (dateFilter) {
      wherePrs.createdAt = dateFilter;
      whereIssues.createdAt = dateFilter;
      whereCommits.createdAt = dateFilter;
    }

    const [prs, issues, commits, repoObj] = await Promise.all([
      prisma.pullRequest.findMany({ where: wherePrs }),
      prisma.issue.findMany({ where: whereIssues }),
      prisma.commit.findMany({ where: whereCommits }),
      prisma.repository.findUnique({ where: { id: dbRepoId } }),
    ]);

    const repoName = repoObj?.fullName || "cognee/cognee";

    const nodes: any[] = [];
    const edges: any[] = [];
    const uniqueFiles = new Set<string>();
    const uniqueContributors = new Set<string>();

    const showPRs = selectedTypes.length === 0 || selectedTypes.includes("pullRequest");
    const showIssues = selectedTypes.length === 0 || selectedTypes.includes("issue");
    const showCommits = selectedTypes.length === 0 || selectedTypes.includes("commit");
    const showContributors = selectedTypes.length === 0 || selectedTypes.includes("contributor");
    const showFiles = selectedTypes.length === 0 || selectedTypes.includes("file");
    const showDecisions = selectedTypes.length === 0 || selectedTypes.includes("decision");

    if (showPRs) {
      prs.forEach((pr) => {
        nodes.push({
          id: pr.id,
          type: "pullRequest",
          position: { x: 150 + Math.random() * 200, y: 80 + Math.random() * 100 },
          data: {
            title: pr.title,
            meta: `${pr.authorLogin || "unknown"} · ${pr.createdAt.toISOString().split("T")[0]}`,
            description: pr.body || "",
            repo: repoName,
          },
        });

        if (pr.authorLogin) {
          uniqueContributors.add(pr.authorLogin);
        }

        const files = (pr.filesAffected as string[]) || [];
        files.forEach((file) => {
          uniqueFiles.add(file);
        });
      });
    }

    if (showIssues) {
      issues.forEach((issue) => {
        nodes.push({
          id: issue.id,
          type: "issue",
          position: { x: 350 + Math.random() * 200, y: 150 + Math.random() * 100 },
          data: {
            title: issue.title,
            meta: `unknown · ${issue.createdAt.toISOString().split("T")[0]}`,
            description: issue.body || "",
            repo: repoName,
          },
        });
      });
    }

    if (showCommits) {
      commits.forEach((commit) => {
        nodes.push({
          id: commit.id,
          type: "commit",
          position: { x: 120 + Math.random() * 200, y: 350 + Math.random() * 100 },
          data: {
            title: `${commit.sha.slice(0, 7)}: ${commit.message}`,
            meta: `${commit.authorLogin || "unknown"} · ${commit.createdAt.toISOString().split("T")[0]}`,
            description: commit.message,
            repo: repoName,
          },
        });

        if (commit.authorLogin) {
          uniqueContributors.add(commit.authorLogin);
        }
      });
    }

    if (showContributors) {
      uniqueContributors.forEach((username) => {
        const id = `contrib:${username}`;
        nodes.push({
          id,
          type: "contributor",
          position: { x: 550 + Math.random() * 250, y: 220 + Math.random() * 150 },
          data: {
            title: `@${username}`,
            meta: "Contributor",
            description: `GitHub contributor @${username}`,
            repo: repoName,
          },
        });

        if (showPRs) {
          prs.forEach((pr) => {
            if (pr.authorLogin === username) {
              edges.push({
                id: `edge-${pr.id}-${id}`,
                source: pr.id,
                target: id,
                type: "default",
                style: { stroke: "#30363d", strokeWidth: 1.5 },
              });
            }
          });
        }
      });
    }

    if (showFiles) {
      uniqueFiles.forEach((filename) => {
        const id = `file:${filename}`;
        nodes.push({
          id,
          type: "file",
          position: { x: 250 + Math.random() * 300, y: 480 + Math.random() * 150 },
          data: {
            title: filename,
            meta: "Codebase File",
            description: `File path: ${filename}`,
            repo: repoName,
          },
        });

        if (showPRs) {
          prs.forEach((pr) => {
            const files = (pr.filesAffected as string[]) || [];
            if (files.includes(filename)) {
              edges.push({
                id: `edge-${pr.id}-${id}`,
                source: pr.id,
                target: id,
                type: "modifies",
                style: { stroke: "#30363d", strokeWidth: 1.5 },
              });
            }
          });
        }
      });
    }

    if (showDecisions && nodes.length > 0) {
      nodes.push({
        id: "dec-demo",
        type: "decision",
        position: { x: 380, y: 280 },
        data: {
          title: "Migrate database access logic to transaction-safe Prisma queries",
          meta: "alex_coder · 2026-06-25",
          description: "Decided to leverage Prisma transactions to guarantee database state integrity during concurrent GitHub webhook bursts.",
          repo: repoName,
        },
      });

      if (showPRs) {
        const randomPR = prs[0];
        if (randomPR) {
          edges.push({
            id: `edge-dec-demo-${randomPR.id}`,
            source: "dec-demo",
            target: randomPR.id,
            type: "supersedes",
            style: { stroke: "#30363d", strokeWidth: 1.5 },
          });
        }
      }
    }

    const graphResponse = { nodes, edges };
    setCachedValue(cacheKey, JSON.stringify(graphResponse), "EX", 10).catch((err) =>
      console.error("[Graph Cache Write Error]", err)
    );

    return NextResponse.json(graphResponse);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

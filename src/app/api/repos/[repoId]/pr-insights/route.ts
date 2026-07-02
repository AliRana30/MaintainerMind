import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Octokit } from "@octokit/rest";
import { cogneeRecall } from "@/lib/cognee-client";
import { getCached, setCached } from "@/lib/cache";
import { recordRecallHits } from "@/server/jobs/enrichment-job";

interface PRInsight {
  id: number;
  number: number;
  title: string;
  url: string;
  author: string;
  authorAvatar: string;
  createdAt: string;
  updatedAt: string;
  state: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  // Risk formula: 1 - (nodes_found / files_changed), 0..100
  riskScore: number;
  // Top-level folders parsed from diff
  affectedSubsystems: string[];
  // Recall results count for quick display
  contextMatches: number;
  filesChanged: string[];
  reviewTime: number | null; // hours from open to first review
}

interface PRInsightsResponse {
  repoFullName: string;
  kpis: {
    avgReviewTimeHours: number;
    contextRecallRate: number; // % PRs with at least 1 recall hit
    prsWithContext: number;
    totalOpenPRs: number;
    maintainerTrustScore: number; // 0-100 composite
  };
  prs: PRInsight[];
  generatedAt: string;
}

function extractSubsystems(files: string[]): string[] {
  const topLevelFolders = new Set<string>();
  for (const f of files) {
    const parts = f.split("/");
    if (parts.length > 1) {
      topLevelFolders.add(parts[0]);
    } else {
      topLevelFolders.add("root");
    }
  }
  return Array.from(topLevelFolders).slice(0, 6);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { repoId } = await params;
    const cacheKey = `pr-insights:v3:${repoId}`;
    const cached = await getCached<PRInsightsResponse>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Resolve repo from DB with slug resolution support
    let foundRepo = null;
    if (repoId.includes("-")) {
      const parts = repoId.split("-");
      const owner = parts[0];
      const name = parts.slice(1).join("-");
      foundRepo = await prisma.repository.findFirst({
        where: {
          OR: [
            { id: repoId },
            { fullName: `${owner}/${name}` },
            { name: name }
          ]
        },
        include: {
          organization: { include: { owner: true } },
          pullRequests: {
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      });
    } else {
      foundRepo = await prisma.repository.findFirst({
        where: {
          OR: [
            { id: repoId },
            { name: repoId }
          ]
        },
        include: {
          organization: { include: { owner: true } },
          pullRequests: {
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      });
    }

    if (!foundRepo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }
    const repo = foundRepo;

    const repoOwner = repo.owner;
    const repoName = repo.name;
    const datasetName = repo.datasetName || `repo:${repo.fullName}`;

    // GitHub token from Clerk user metadata or env
    const githubToken = process.env.GITHUB_TOKEN;
    const octokit = githubToken
      ? new Octokit({ auth: githubToken })
      : new Octokit();

    // Fetch open PRs from GitHub
    let githubPRs: any[] = [];
    try {
      const { data } = await octokit.pulls.list({
        owner: repoOwner,
        repo: repoName,
        state: "open",
        per_page: 15,
        sort: "updated",
        direction: "desc",
      });
      githubPRs = data;
    } catch (err) {
      console.warn(`GitHub PR fetch failed for ${repo.fullName}:`, err);
      // Fall back to DB PRs
      githubPRs = repo.pullRequests
        .filter((p) => p.state === "open")
        .map((p) => ({
          number: p.githubPrNumber,
          title: p.title,
          html_url: `https://github.com/${repo.fullName}/pull/${p.githubPrNumber}`,
          user: { login: p.authorLogin || "unknown", avatar_url: "" },
          created_at: p.createdAt.toISOString(),
          updated_at: p.updatedAt.toISOString(),
          state: "open",
          additions: 0,
          deletions: 0,
          changed_files: 0,
          _files: [],
        }));
    }

    // Enrich each PR with file diffs + risk score via cognee.recall()
    const enrichedPRs: PRInsight[] = [];
    let totalRecallHits = 0;

    for (const pr of githubPRs.slice(0, 12)) {
      let filesChanged: string[] = [];
      let additions = pr.additions || 0;
      let deletions = pr.deletions || 0;
      let changedFilesCount = pr.changed_files || 0;

      // Try fetching file list from GitHub
      try {
        if (githubToken) {
          const { data: files } = await octokit.pulls.listFiles({
            owner: repoOwner,
            repo: repoName,
            pull_number: pr.number,
            per_page: 30,
          });
          filesChanged = files.map((f: any) => f.filename);
          additions = files.reduce((a: number, f: any) => a + (f.additions || 0), 0);
          deletions = files.reduce((a: number, f: any) => a + (f.deletions || 0), 0);
          changedFilesCount = files.length;
        }
      } catch {
        // silently fall back
      }

      // cognee.recall() for this PR's files
      let nodesFound = 0;
      let contextMatches = 0;
      try {
        const recallQuery = filesChanged.length > 0
          ? `Files changed in PR: ${filesChanged.slice(0, 10).join(", ")}. PR title: ${pr.title}`
          : `PR: ${pr.title}`;

        const recallResults = await cogneeRecall(recallQuery, {
          datasets: [datasetName],
          searchType: "GRAPH_COMPLETION",
          topK: 6,
        });

        await recordRecallHits(repo.id, recallResults.map((result: any) => result.metadata?.id || result.raw?.id || result.id).filter(Boolean));

        contextMatches = recallResults.length;
        nodesFound = recallResults.filter((r: any) => {
          // A node is "found" if the recalled text references any of the changed files
          const text = (r.text || r.content || r.answer || "").toLowerCase();
          return filesChanged.some((f) => text.includes(f.toLowerCase().split("/").pop() || ""));
        }).length;

        if (contextMatches > 0) totalRecallHits++;
      } catch {
        // Cognee unavailable — zero context
      }

      // Risk formula: 1 - (nodes_found / files_changed), clamped 0..100
      const riskScore =
        changedFilesCount > 0
          ? Math.round((1 - Math.min(nodesFound, changedFilesCount) / changedFilesCount) * 100)
          : 50; // unknown = medium risk

      const affectedSubsystems = extractSubsystems(filesChanged);

      // Review time: hours from PR creation to now (approximation when no review data)
      const ageHours = Math.round(
        (Date.now() - new Date(pr.created_at).getTime()) / (1000 * 60 * 60)
      );

      enrichedPRs.push({
        id: pr.id || pr.number,
        number: pr.number,
        title: pr.title,
        url: pr.html_url || `https://github.com/${repo.fullName}/pull/${pr.number}`,
        author: pr.user?.login || "unknown",
        authorAvatar: pr.user?.avatar_url || "",
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        state: pr.state || "open",
        additions,
        deletions,
        changedFiles: changedFilesCount,
        riskScore,
        affectedSubsystems,
        contextMatches,
        filesChanged: filesChanged.slice(0, 20),
        reviewTime: ageHours > 0 ? ageHours : null,
      });
    }

    // Aggregate KPIs
    const avgReviewTime =
      enrichedPRs.length > 0
        ? Math.round(
            enrichedPRs.reduce((a, p) => a + (p.reviewTime || 0), 0) /
              enrichedPRs.length
          )
        : 0;

    const contextRecallRate =
      githubPRs.length > 0
        ? Math.round((totalRecallHits / Math.min(githubPRs.length, 12)) * 100)
        : 0;

    const avgRisk =
      enrichedPRs.length > 0
        ? enrichedPRs.reduce((a, p) => a + p.riskScore, 0) / enrichedPRs.length
        : 50;

    // Trust score: inverse of avg risk, weighted with recall rate
    const maintainerTrustScore = Math.round(
      (100 - avgRisk) * 0.6 + contextRecallRate * 0.4
    );

    const response: PRInsightsResponse = {
      repoFullName: repo.fullName,
      kpis: {
        avgReviewTimeHours: avgReviewTime,
        contextRecallRate,
        prsWithContext: totalRecallHits,
        totalOpenPRs: enrichedPRs.length,
        maintainerTrustScore: Math.max(0, Math.min(100, maintainerTrustScore)),
      },
      prs: enrichedPRs,
      generatedAt: new Date().toISOString(),
    };

    setCached(cacheKey, response, 60).catch((err) =>
      console.error("[PR Insights Cache Write Error]", err)
    );
    return NextResponse.json(response);
  } catch (err: any) {
    console.error("PR insights error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

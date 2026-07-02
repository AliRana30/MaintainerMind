import crypto from "crypto";
import { redis } from "@/lib/redis";
import {
  cogneeRemember,
  cogneeRecall,
  cogneeImprove,
  cogneeForget,
  RecallResultUnion
} from "@/lib/cognee-client";

export interface GitHubPayload {
  type: "pull_request" | "issue" | "commit";
  owner: string;
  repo: string;
  id: string | number;
  state?: string;
  title?: string;
  body?: string;
  files?: Array<{ filename: string; patch?: string; content?: string }>;
  commitMessage?: string;
  author?: string;
  url?: string;
}

export async function rememberGitHubContent(payload: GitHubPayload): Promise<string> {
  const hash = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  const cacheKey = `cognee:idem:${hash}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return cached;
  }

  let text = `Type: ${payload.type}\nRepository: ${payload.owner}/${payload.repo}\nURL: ${payload.url || ""}\n`;
  if (payload.type === "pull_request") {
    text += `PR Title: ${payload.title || ""}\nPR Body: ${payload.body || ""}\n`;
    if (payload.files) {
      text += `Files Changed:\n` + payload.files.map(f => `- ${f.filename}\nPatch:\n${f.patch || ""}`).join("\n");
    }
  } else if (payload.type === "issue") {
    text += `Issue Title: ${payload.title || ""}\nIssue Body: ${payload.body || ""}\n`;
  } else if (payload.type === "commit") {
    text += `Commit Message: ${payload.commitMessage || ""}\nAuthor: ${payload.author || ""}\n`;
    if (payload.files) {
      text += `Files Changed:\n` + payload.files.map(f => `- ${f.filename}\nPatch:\n${f.patch || ""}`).join("\n");
    }
  }

  const datasetName = `repo:${payload.owner}/${payload.repo}`;
  const result = await cogneeRemember(text, datasetName, {
    runInBackground: true
  });

  const datasetId = result.dataset_id || "";
  await redis.set(cacheKey, datasetId, "EX", 86400);
  return datasetId;
}

export async function recallForPR(
  prTitle: string,
  prBody: string,
  files: string[],
  datasetName: string
): Promise<RecallResultUnion[]> {
  const hash = crypto.createHash("sha256").update(JSON.stringify({ prTitle, prBody, files, datasetName })).digest("hex");
  const cacheKey = `cognee:recall:${hash}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const query = `Find past decisions, rejected approaches, and issues related to: ${prTitle}. Files: ${files.join(", ")}`;
  const results = await cogneeRecall(query, {
    datasets: [datasetName],
    searchType: "GRAPH_COMPLETION",
    topK: 8
  });

  await redis.set(cacheKey, JSON.stringify(results), "EX", 300);
  return results;
}

export async function recallForChat(
  query: string,
  datasetName: string,
  sessionId?: string
): Promise<RecallResultUnion[]> {
  return cogneeRecall(query, {
    datasets: [datasetName],
    searchType: "GRAPH_COMPLETION",
    topK: 8,
    sessionId,
    scope: sessionId ? "all" : undefined
  });
}

export async function triggerImprove(datasetName: string): Promise<void> {
  const limitKey = `cognee:improve:limit:${datasetName}`;
  const locked = await redis.get(limitKey);
  if (locked) {
    return;
  }

  await cogneeImprove(datasetName, { runInBackground: true });
  await redis.set(limitKey, "true", "EX", 1800);
}

export async function pruneDataset(datasetName: string, memoryOnly: boolean): Promise<void> {
  await cogneeForget({ dataset: datasetName, memoryOnly });
  
  const keys = await redis.keys("cognee:*");
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

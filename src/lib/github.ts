import crypto from "crypto";
import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import { env } from "@/env";
import { redis } from "@/lib/redis";

const privateKey = env.GITHUB_PRIVATE_KEY.startsWith("-----")
  ? env.GITHUB_PRIVATE_KEY.replace(/\\n/g, "\n")
  : Buffer.from(env.GITHUB_PRIVATE_KEY, "base64").toString("utf-8");

export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!signature) return false;
  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(rawBody).digest("hex");

  if (signature.length !== digest.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function getInstallationOctokit(installationId: string) {
  const cacheKey = `gh:token:${installationId}`;
  let cachedToken = null;
  
  try {
    if (redis.status === "ready") {
      cachedToken = await redis.get(cacheKey);
    }
  } catch (err) {
    console.warn("[Redis Token Cache Get Warning]", err);
  }

  if (cachedToken) {
    return new Octokit({ auth: cachedToken });
  }

  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: env.GITHUB_APP_ID,
      privateKey,
      installationId: Number(installationId),
    },
  });

  const { token } = (await octokit.auth({ type: "installation" })) as {
    token: string;
  };

  try {
    if (redis.status === "ready") {
      await redis.set(cacheKey, token, "EX", 3300);
    }
  } catch (err) {
    console.warn("[Redis Token Cache Set Warning]", err);
  }
  return octokit;
}

export function formatPRForMemory(
  pr: {
    number: number;
    title: string;
    state: string;
    user: { login: string };
    body?: string | null;
    labels?: Array<{ name: string }>;
  },
  files: Array<{ filename: string }>,
  reviews: Array<{ user: { login: string }; state: string; body?: string | null }>,
  comments: Array<{ user: { login: string }; body: string }>
): string {
  const filenames = files.map((f) => f.filename).join(", ");
  const labelNames = pr.labels?.map((l) => l.name).join(", ") || "";

  const reviewsText = reviews
    .map((r) => `- ${r.user.login} (${r.state}): ${r.body || ""}`)
    .join("\n");

  const commentsText = comments
    .map((c) => `- ${c.user.login}: ${c.body}`)
    .join("\n");

  return `## PR #${pr.number}: ${pr.title}\nState: ${pr.state}\nAuthor: ${pr.user.login}\nFiles changed: ${filenames}\n\n### Description\n${pr.body || ""}\n\n### Review Comments\n${commentsText}\n${reviewsText}\n\nLabels: ${labelNames}`;
}

export function formatIssueForMemory(
  issue: {
    number: number;
    title: string;
    state: string;
    body?: string | null;
    labels?: Array<{ name: string }>;
  },
  comments: Array<{ user: { login: string }; body: string }>
): string {
  const labelNames = issue.labels?.map((l) => l.name).join(", ") || "";
  const commentsText = comments
    .map((c) => `- ${c.user.login}: ${c.body}`)
    .join("\n");

  return `## Issue #${issue.number}: ${issue.title}\nState: ${issue.state}\n\n### Description\n${issue.body || ""}\n\n### Comments\n${commentsText}\n\nLabels: ${labelNames}`;
}

export function formatCommitForMemory(commit: {
  sha: string;
  commit: { message: string; author?: { name?: string } };
  author?: { login?: string };
}): string {
  const message = commit.commit.message;
  if (message.trim().length < 10) return "";
  const author = commit.author?.login || commit.commit.author?.name || "unknown";
  return `## Commit ${commit.sha.substring(0, 7)}\nAuthor: ${author}\nMessage: ${message}`;
}

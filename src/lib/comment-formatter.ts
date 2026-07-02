import { RecallResultUnion } from "@/lib/cognee-client";

export interface PR {
  number: number;
  title: string;
  filesAffected?: string[];
  repoId?: string;
}

export function extractConfidenceScore(results: RecallResultUnion[]): number {
  const graphResults = results.filter((r) => r.source === "graph") as Extract<
    RecallResultUnion,
    { source: "graph" }
  >[];
  if (graphResults.length === 0) {
    return 0;
  }
  const totalScore = graphResults.reduce((sum, r) => sum + r.score, 0);
  return Math.round((totalScore / graphResults.length) * 100);
}

function getOneSentenceSummary(text: string): string {
  if (!text) return "No description available.";
  // Extract first non-empty line or sentence
  const cleanText = text.replace(/^#+\s*/, "").trim();
  const sentences = cleanText.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  if (sentences.length > 0) {
    const s = sentences[0];
    return s.endsWith(".") ? s : s + ".";
  }
  return cleanText.substring(0, 100).trim() + "...";
}

export function formatRecallComment(
  results: RecallResultUnion[],
  prData: PR
): string | null {
  if (!results || results.length === 0) {
    return null;
  }

  const graphResults = results.filter((r) => r.source === "graph") as Extract<
    RecallResultUnion,
    { source: "graph" }
  >[];

  const sessionResults = results.filter((r) => r.source === "session") as Extract<
    RecallResultUnion,
    { source: "session" }
  >[];

  // If there are graph results, check if all graph source results have score < 0.2
  if (graphResults.length > 0) {
    const hasHighConfidence = graphResults.some((r) => r.score >= 0.2);
    if (!hasHighConfidence) {
      return null;
    }
  }

  const confidenceScore = extractConfidenceScore(results);
  const totalRecalled = graphResults.length + sessionResults.length;

  let markdown = `## 🧠 MaintainerMind — Repository Memory\n\n`;

  // Badges & inline code styles
  markdown += `\`${confidenceScore}% confident\` \`${totalRecalled} items recalled\`\n\n`;

  // Note limited context if only session source results are present
  if (graphResults.length === 0 && sessionResults.length > 0) {
    markdown += `> ⚠️ **Note:** Limited context available. No relevant graph memory records were recalled; results are based solely on active session history.\n\n`;
  }

  // Group and sort graph results by score descending
  const sortedGraph = [...graphResults].sort((a, b) => b.score - a.score);

  if (sortedGraph.length > 0) {
    markdown += `### Relevant Historical Context\n`;

    const top3 = sortedGraph.slice(0, 3);
    const remaining = sortedGraph.slice(3);

    const formatItem = (r: typeof sortedGraph[0]) => {
      const type = r.kind || "Reference";
      const title = r.text
        ? r.text.split("\n")[0].replace(/^#+\s*/, "").trim().substring(0, 70)
        : "Historical Context";
      const date = r.metadata?.date || r.metadata?.timestamp || "recent";
      const author = r.metadata?.author || "maintainer";
      const summary = getOneSentenceSummary(r.text);

      const pct = Math.min(100, Math.max(0, Math.round(r.score * 100)));
      const filled = Math.min(10, Math.max(0, Math.round(r.score * 10)));
      const bar = "█".repeat(filled) + "░".repeat(10 - filled);

      return `**[${type}]** ${title} — *${date}* — ${author}\n> ${summary}\nRelevance: ${bar} ${pct}%\n\n`;
    };

    top3.forEach((item) => {
      markdown += formatItem(item);
    });

    if (remaining.length > 0) {
      markdown += `<details>\n<summary>📚 ${remaining.length} more items (click to expand)</summary>\n\n`;
      remaining.forEach((item) => {
        markdown += formatItem(item);
      });
      markdown += `</details>\n\n`;
    }
  }

  // Risk Indicators (evidence of past rejections or conflicts)
  const risks: string[] = [];
  results.forEach((r) => {
    const textToCheck = r.source === "graph" ? r.text : r.source === "session" ? r.context : r.source === "trace" ? r.memory_context : "";
    const txt = (textToCheck || "").toLowerCase();

    if (/reject|rollback|revert|deny/i.test(txt)) {
      risks.push("Previous configuration changes or pull requests in this scope were rejected or rolled back.");
    }
    if (/leak|memory/i.test(txt)) {
      risks.push("Memory management issues or lifecycle cleanup leaks were flagged in related modules.");
    }
    if (/bug|regression|conflict/i.test(txt)) {
      risks.push("Code paths nearby have regression histories or merge conflict complications.");
    }
  });

  const uniqueRisks = Array.from(new Set(risks));
  if (uniqueRisks.length > 0) {
    markdown += `### ⚠️ Risk Indicators\n`;
    uniqueRisks.forEach((risk) => {
      markdown += `- ${risk}\n`;
    });
    markdown += `\n`;
  }

  // Affected Subsystems
  const files = prData.filesAffected || [];
  const subsystems = Array.from(
    new Set(files.map((f) => f.split("/")[0]).filter(Boolean))
  );

  if (subsystems.length > 0) {
    markdown += `### Affected Subsystems\n`;
    const subsystemBadges = subsystems.map((sub) => `\`${sub}\``).join(" ");
    markdown += `${subsystemBadges}\n\n`;
  }

  // Footer section
  const repoName = prData.repoId || "repo";
  markdown += `---\n`;
  markdown += `_Powered by [MaintainerMind](https://maintainermind.ai) × Cognee | [View full context](https://maintainermind.ai/dashboard/repos/${repoName}/prs/${prData.number}) | [Rate this recall](https://maintainermind.ai/feedback)_\n`;

  // Enforce max 600 words total
  const words = markdown.split(/\s+/);
  if (words.length > 600) {
    markdown = words.slice(0, 580).join(" ") + "\n\n... (content truncated to meet word count rules)";
  }

  return markdown;
}

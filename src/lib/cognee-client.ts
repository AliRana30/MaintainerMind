import { env } from "@/env";

const BASE = env.COGNEE_BASE_URL;
const KEY = env.COGNEE_API_KEY;

const apiHeaders = (extra = {}) => ({
  "X-Api-Key": KEY,
  ...extra,
});

const jsonHeaders = () => ({
  "X-Api-Key": KEY,
  "Content-Type": "application/json",
});

export class CogneeError extends Error {
  constructor(public status: number, public detail: string) {
    super(`Cognee API ${status}: ${detail}`);
  }
}

interface CircuitState {
  failures: number;
  lastFailureTime: number;
  status: "CLOSED" | "OPEN";
}

const circuits = new Map<string, CircuitState>();

function getCircuit(pathname: string): CircuitState {
  let state = circuits.get(pathname);
  if (!state) {
    state = { failures: 0, lastFailureTime: 0, status: "CLOSED" };
    circuits.set(pathname, state);
  }

  if (state.status === "OPEN" && Date.now() - state.lastFailureTime > 300000) {
    state.status = "CLOSED";
    state.failures = 0;
  }

  return state;
}

function recordSuccess(pathname: string) {
  const state = getCircuit(pathname);
  state.failures = 0;
  state.status = "CLOSED";
}

function recordFailure(pathname: string) {
  const state = getCircuit(pathname);
  state.failures += 1;
  state.lastFailureTime = Date.now();
  if (state.failures >= 5) {
    state.status = "OPEN";
  }
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = 3,
  baseDelay = 1000,
  timeoutMs = 12000
): Promise<Response> {
  const parsedUrl = new URL(url);
  const pathname = parsedUrl.pathname;
  const circuit = getCircuit(pathname);

  if (circuit.status === "OPEN") {
    throw new Error(`Circuit breaker is OPEN for ${pathname}`);
  }

  let attempt = 1;
  while (true) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.status === 429) {
        const retryAfterHeader = res.headers.get("Retry-After");
        const seconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 1;
        await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
        if (attempt < retries) {
          attempt++;
          continue;
        }
      }

      if (!res.ok) {
        throw new CogneeError(res.status, await res.text());
      }

      recordSuccess(pathname);
      return res;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error instanceof CogneeError && error.status === 429 && attempt < retries) {
        attempt++;
        continue;
      }

      if (attempt >= retries) {
        recordFailure(pathname);
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt++;
    }
  }
}

export async function cogneeRemember(
  text: string,
  datasetName: string,
  opts?: {
    sessionId?: string;
    runInBackground?: boolean;
    chunkSize?: number;
    customPrompt?: string;
  }
): Promise<{ dataset_id?: string }> {
  const formData = new FormData();
  formData.append("data", new Blob([text], { type: "text/plain" }), "content.txt");
  formData.append("datasetName", datasetName);

  if (opts?.runInBackground !== undefined) {
    formData.append("run_in_background", String(opts.runInBackground));
  }
  if (opts?.chunkSize !== undefined) {
    formData.append("chunk_size", String(opts.chunkSize));
  }
  if (opts?.sessionId !== undefined) {
    formData.append("session_id", opts.sessionId);
  }
  if (opts?.customPrompt !== undefined) {
    formData.append("custom_prompt", opts.customPrompt);
  }

  const res = await fetchWithRetry(`${BASE}/api/v1/remember`, {
    method: "POST",
    headers: apiHeaders(),
    body: formData,
  });

  return res.json();
}

export type RecallResultUnion =
  | {
      source: "graph";
      kind: string;
      search_type: string;
      text: string;
      score: number;
      dataset_id: string;
      metadata?: any;
      raw?: any;
    }
  | {
      source: "session";
      question: string;
      answer: string;
      context: string;
      time: string;
      qa_id: string;
      feedback_score?: number;
    }
  | {
      source: "graph_context";
      content: string;
    }
  | {
      source: "trace";
      trace_id: string;
      origin_function: string;
      status: string;
      memory_context: string;
    };

export async function cogneeRecall(
  query: string,
  opts: {
    datasets?: string[];
    searchType?:
      | "GRAPH_COMPLETION"
      | "RAG_COMPLETION"
      | "CHUNKS"
      | "TEMPORAL"
      | "FEELING_LUCKY"
      | "SUMMARIES"
      | "TRIPLET_COMPLETION"
      | "NATURAL_LANGUAGE"
      | "AGENTIC_COMPLETION";
    topK?: number;
    sessionId?: string;
    systemPrompt?: string;
    scope?: string;
  }
): Promise<RecallResultUnion[]> {
  const res = await fetchWithRetry(`${BASE}/api/v1/recall`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({
      query,
      datasets: opts.datasets,
      searchType: opts.searchType,
      topK: opts.topK,
      sessionId: opts.sessionId,
      systemPrompt: opts.systemPrompt,
      scope: opts.scope,
    }),
  });

  return res.json();
}

export async function cogneeImprove(
  datasetName: string,
  opts?: {
    runInBackground?: boolean;
    enrichmentTasks?: string[];
    sessionIds?: string[];
    buildGlobalContextIndex?: boolean;
  }
): Promise<void> {
  await fetchWithRetry(`${BASE}/api/v1/improve`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({
      datasetName,
      runInBackground: opts?.runInBackground,
      enrichmentTasks: opts?.enrichmentTasks,
      sessionIds: opts?.sessionIds,
      buildGlobalContextIndex: opts?.buildGlobalContextIndex,
    }),
  });
}

export async function cogneeForget(opts: {
  dataset?: string;
  datasetId?: string;
  dataId?: string;
  nodeIds?: string[];
  memoryOnly?: boolean;
  everything?: boolean;
}): Promise<void> {
  await fetchWithRetry(`${BASE}/api/v1/forget`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({
      dataset: opts.dataset,
      datasetId: opts.datasetId,
      dataId: opts.dataId,
      node_ids: opts.nodeIds,
      memoryOnly: opts.memoryOnly,
      everything: opts.everything,
    }),
  });
}

export async function cogneeDatasetStatus(datasetId: string): Promise<string> {
  const res = await fetchWithRetry(
    `${BASE}/api/v1/datasets/status?dataset=${datasetId}`,
    {
      method: "GET",
      headers: apiHeaders(),
    }
  );

  const data = await res.json();
  return data[datasetId] || "";
}

export async function waitForIngestion(
  datasetId: string,
  timeoutMs = 300000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const status = await cogneeDatasetStatus(datasetId);
    if (status === "DATASET_PROCESSING_COMPLETED") {
      return;
    }
    if (status === "DATASET_PROCESSING_ERRORED") {
      throw new Error(`Dataset processing failed for ${datasetId}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(`Ingestion timeout for dataset ${datasetId}`);
}

export interface Dataset {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export async function cogneeListDatasets(): Promise<Dataset[]> {
  const res = await fetchWithRetry(`${BASE}/api/v1/datasets`, {
    method: "GET",
    headers: apiHeaders(),
  });

  return res.json();
}

export async function cogneeExportDataset(id: string): Promise<string> {
  const res = await fetchWithRetry(`${BASE}/api/v1/activity/export/${id}`, {
    method: "GET",
    headers: apiHeaders(),
  });

  return res.text();
}

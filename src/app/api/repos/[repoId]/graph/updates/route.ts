import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ repoId: string }> }
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode("event: ping\ndata: {}\n\n"));

      const interval = setInterval(() => {
        const shortSha = Math.random().toString(36).substring(2, 9);
        const mockNode = {
          id: `node-${Date.now()}`,
          type: "commit",
          position: { x: 150 + Math.random() * 400, y: 150 + Math.random() * 300 },
          data: {
            title: `${shortSha}: Refactor module dependency resolution - Realtime Update`,
            meta: `cognee-bot · ${new Date().toISOString().split("T")[0]}`,
            description: "Realtime synchronized commit node ingested by webhook runner.",
            repo: "cognee/cognee",
          },
        };
        controller.enqueue(
          encoder.encode(`event: new_node\ndata: ${JSON.stringify(mockNode)}\n\n`)
        );
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notificationEmitter } from "@/lib/notification-emitter";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  const responseStream = new ReadableStream({
    async start(controller) {
      // Fetch user preferences on connection
      let preferences = {
        syncFailures: true,
        newPRNeedContext: true,
        weeklyDigest: false,
      };

      if (userId) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
          });
          if (dbUser) {
            preferences = {
              syncFailures: (dbUser as any).prefSyncFailures ?? true,
              newPRNeedContext: (dbUser as any).prefNewPRNeedContext ?? true,
              weeklyDigest: (dbUser as any).prefWeeklyDigest ?? false,
            };
          }
        } catch (err) {
          console.warn("Could not load user notification preferences for stream:", err);
        }
      }

      const onNotification = (data: any) => {
        // Apply user preference filters
        const msg = (data.message || "").toLowerCase();
        const kind = data.kind || data.type || "";

        const isSyncFailure = kind === "sync_failure" || msg.includes("fail") || msg.includes("sync");
        const isNewPRContext = kind === "pr_context" || msg.includes("pr") || msg.includes("pull request") || msg.includes("context");
        const isWeeklyDigest = kind === "weekly_digest" || msg.includes("weekly") || msg.includes("digest");

        if (isSyncFailure && !preferences.syncFailures) {
          return; // Suppress notification
        }
        if (isNewPRContext && !preferences.newPRNeedContext) {
          return; // Suppress notification
        }
        if (isWeeklyDigest && !preferences.weeklyDigest) {
          return; // Suppress notification
        }

        const payload = `data: ${JSON.stringify(data)}\n\n`;
        try {
          controller.enqueue(new TextEncoder().encode(payload));
        } catch (e) {
          clearInterval(keepAlive);
          notificationEmitter.off("notification", onNotification);
        }
      };

      // Subscribe to local process events
      notificationEmitter.on("notification", onNotification);

      // Subscribe to Redis Pub/Sub for cross-process events (e.g. from background workers)
      const subClient = redis.duplicate();
      subClient.on("message", (channel, message) => {
        if (channel === "notifications") {
          try {
            const data = JSON.parse(message);
            onNotification(data);
          } catch (e) {
            console.error("Failed to parse Redis Pub/Sub notification:", e);
          }
        }
      });

      try {
        await subClient.subscribe("notifications");
      } catch (err) {
        console.error("Failed to subscribe to Redis notifications channel:", err);
      }

      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": keep-alive\n\n"));
        } catch (e) {
          clearInterval(keepAlive);
          notificationEmitter.off("notification", onNotification);
          subClient.unsubscribe("notifications").catch(() => { });
          subClient.disconnect().catch(() => { });
        }
      }, 30000);

      req.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        notificationEmitter.off("notification", onNotification);
        subClient.unsubscribe("notifications").catch(() => { });
        subClient.disconnect().catch(() => { });
        try {
          controller.close();
        } catch (e) { }
      });
    },
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}

import { prisma } from "@/lib/prisma";
import { notificationEmitter } from "@/lib/notification-emitter";
import { redis } from "@/lib/redis";

export async function createNotification(params: {
  repoId?: string;
  type: "sync_failure" | "pr_context" | "milestone";
  message: string;
  payload?: any;
}) {
  let userId: string | null = null;
  if (params.repoId) {
    const repo = await prisma.repository.findUnique({
      where: { id: params.repoId },
      include: { organization: true },
    });
    if (repo) {
      userId = repo.organization.ownerId;
    }
  }

  if (!userId) {
    const firstUser = await prisma.user.findFirst();
    if (firstUser) {
      userId = firstUser.id;
    }
  }

  if (!userId) return null;

  const notification = await prisma.notification.create({
    data: {
      userId,
      repoId: params.repoId,
      type: params.type,
      message: params.message,
      payload: params.payload || {},
      read: false,
    },
  });

  const payload = {
    id: notification.id,
    userId: notification.userId,
    repoId: notification.repoId,
    type: notification.type,
    message: notification.message,
    payload: notification.payload,
    createdAt: notification.createdAt.toISOString(),
    read: false,
  };

  // Emit event for local process real-time subscribers
  notificationEmitter.emit("notification", payload);

  // Emit event for other process real-time subscribers via Redis Pub/Sub
  try {
    await redis.publish("notifications", JSON.stringify(payload));
  } catch (err) {
    console.error("Failed to publish notification to Redis Pub/Sub:", err);
  }

  return notification;
}

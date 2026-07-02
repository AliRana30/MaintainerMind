import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/github";
import { ingestionQueue } from "@/server/queues";
import { notificationEmitter } from "@/lib/notification-emitter";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256") || "";
    const secret = process.env.GITHUB_WEBHOOK_SECRET || "";

    if (!verifyWebhookSignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const eventType = req.headers.get("x-github-event") || "";
    const githubEventId = req.headers.get("x-github-delivery") || "";

    const allowedEvents = [
      "pull_request",
      "issues",
      "push",
      "issue_comment",
      "pull_request_review",
      "installation",
    ];

    if (!allowedEvents.includes(eventType)) {
      return NextResponse.json({ ignored: true });
    }

    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { githubEventId },
    });

    if (existingEvent) {
      return NextResponse.json({ received: true, deduplicated: true });
    }

    const payload = JSON.parse(rawBody);

    // Handle installation event for App Uninstallation
    if (eventType === "installation") {
      const action = payload.action;
      if (action === "deleted") {
        const installationId = String(payload.installation?.id);
        if (installationId) {
          console.log(`[Webhook] GitHub App uninstalled. Deleting repositories for installationId: ${installationId}`);
          await prisma.repository.deleteMany({
            where: { githubInstallationId: installationId },
          });
          return NextResponse.json({ deleted: true });
        }
      }
      return NextResponse.json({ received: true });
    }

    const githubRepoId = String(payload.repository?.id);
    const repoFullName = payload.repository?.full_name;

    if (!githubRepoId) {
      return NextResponse.json({ error: "Missing repository" }, { status: 400 });
    }

    const repository = await prisma.repository.findFirst({
      where: {
        OR: [
          { githubRepoId },
          { fullName: repoFullName },
        ],
      },
    });

    if (!repository) {
      return NextResponse.json({ error: "Repository not registered" }, { status: 404 });
    }

    const event = await prisma.webhookEvent.create({
      data: {
        repoId: repository.id,
        githubEventId,
        eventType,
        payload,
        status: "PENDING",
      },
    });

    notificationEmitter.emit("notification", {
      type: "info",
      message: `Received new ${eventType} webhook payload.`,
      repo: repoFullName,
    });

    await ingestionQueue.add("ingest", {
      webhookEventId: event.id,
      repoFullName,
      eventType,
      payload,
    });

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

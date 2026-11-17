import { NextResponse } from "next/server";
import { env } from "@/env";
import { VinboxNylasClient } from "@/utils/nylas/vinbox-client";
import prisma from "@/utils/prisma";
import { createScopedLogger } from "@/utils/logger";

const logger = createScopedLogger("nylas/webhook");

export const POST = async (request: Request) => {
  try {
    const signature = request.headers.get("x-nylas-signature");
    const timestamp = request.headers.get("x-nylas-timestamp");

    if (!signature || !timestamp) {
      logger.warn("Nylas webhook missing signature or timestamp");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const payload = await request.text();
    const webhookSecret = env.NYLAS_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.warn("Nylas webhook secret not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const crypto = await import("node:crypto");
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(`${timestamp}.${payload}`)
      .digest("hex");

    if (signature !== expectedSignature) {
      logger.warn("Nylas webhook signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(payload);
    logger.info("Received Nylas webhook", { type: event.type, grantId: event.grant_id });

    const grantId = event.grant_id;
    if (!grantId) {
      return NextResponse.json({ error: "Missing grant_id" }, { status: 400 });
    }

    const account = await prisma.account.findUnique({
      where: { providerAccountId: grantId, provider: "nylas" },
      select: { userId: true, emailAccount: { select: { id: true, email: true } } },
    });

    if (!account) {
      logger.warn("Nylas webhook for unknown grant", { grantId });
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    switch (event.type) {
      case "message.created":
      case "message.updated":
        await handleMessageEvent(account.userId, account.emailAccount.id, event, grantId);
        break;
      case "message.deleted":
        await handleMessageDeleted(account.userId, account.emailAccount.id, event, grantId);
        break;
      case "thread.created":
      case "thread.updated":
        await handleThreadEvent(account.userId, account.emailAccount.id, event, grantId);
        break;
      case "folder.created":
      case "folder.updated":
      case "folder.deleted":
        await handleFolderEvent(account.userId, account.emailAccount.id, event, grantId);
        break;
      default:
        logger.info("Unhandled Nylas webhook type", { type: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Nylas webhook processing failed", { error });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
};

async function handleMessageEvent(
  userId: string,
  emailAccountId: string,
  event: { data: { id: string; [key: string]: unknown }; [key: string]: unknown },
  grantId: string,
) {
  const client = new VinboxNylasClient({
    apiKey: process.env.NYLAS_API_KEY!,
    region: (process.env.NYLAS_REGION as "us" | "eu") || "us",
  });

  try {
    const { data: message } = await client.getMessage(grantId, event.data.id);
    logger.info("Nylas message synced", { messageId: message.id, emailAccountId });
  } catch (error) {
    logger.error("Failed to sync Nylas message", { error, messageId: event.data.id });
  }
}

async function handleMessageDeleted(
  userId: string,
  emailAccountId: string,
  event: { data: { id: string; [key: string]: unknown }; [key: string]: unknown },
  grantId: string,
) {
  logger.info("Nylas message deleted", { messageId: event.data.id, emailAccountId });
}

async function handleThreadEvent(
  userId: string,
  emailAccountId: string,
  event: { data: { id: string; [key: string]: unknown }; [key: string]: unknown },
  grantId: string,
) {
  logger.info("Nylas thread event", { threadId: event.data.id, type: event.type, emailAccountId });
}

async function handleFolderEvent(
  userId: string,
  emailAccountId: string,
  event: { data: { id: string; name: string; [key: string]: unknown }; [key: string]: unknown },
  grantId: string,
) {
  logger.info("Nylas folder event", { folderId: event.data.id, name: event.data.name, type: event.type, emailAccountId });
}